const express = require('express');
const path = require('path');
const app = express();
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const MongoStore = require('connect-mongo');
require('dotenv').config();

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: '암호화에 쓸 비번',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 12 * 60 * 60 * 1000 },
  store: MongoStore.create({
    mongoUrl: process.env.DB_URL,
    dbName: 'forum'
  })
}));

app.use(passport.initialize());
app.use(passport.session());

let connectDB = require('./database.js');

let db;
connectDB.then((client) => {
  console.log('DB연결성공');
  db = client.db('forum');

  app.listen(8080, () => {
    console.log('http://localhost:8080 에서 서버 실행중');
  });
}).catch((err) => {
  console.log(err);
});


// 로그인 상태 확인 미들웨어
function logAuthenticatedUser(req, res, next) {
  if (req.isAuthenticated()) {
    console.log(`로그인 성공 ID: ${req.user.username}`);
  } else {
    console.log('로그아웃 되어있습니다');
  }
  next();
}

app.use(logAuthenticatedUser);

// 로그인된 사용자를 리디렉션하는 미들웨어
function redirectIfAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/list/1');
  }
  next();
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// app.get('/', (req, res) => {
//   res.redirect('https://planittour.kr');  // 원하는 주소로 리다이렉트
// });


// 상담설문지 로그인 확인 미들웨어
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}


// 검색 페이지

app.get('/search', async (req, res) => {
  console.log(req.query.val)
  let 검색조건 = [
    {$search : {
      index : 'name_index',
      text : { 
        query : req.query.val, 
        path : ['groomname', 'bridename']
      }
    }}
  ]

  let result = await db.collection('post')
  .aggregate(검색조건).toArray()
  res.render('search.ejs', { 글목록 : result})
})


// 리스트 파일
app.get('/list', ensureAuthenticated, (req, res) => {
  res.redirect('/list/1');  // 처음에 /list로 접속하면 /list/1로 리다이렉트
});

// 리스트
app.get('/list/:id', ensureAuthenticated, async (req, res) => {
  const 글당개수 = 5; // 한 페이지당 표시할 글 개수
  const 현재페이지 = parseInt(req.params.id) || 1; // 현재 페이지 번호, 기본값은 1

  try {
    // 전체 글 개수 계산
    const 총글개수 = await db.collection('post').countDocuments();

    // 전체 페이지 수 계산
    const 총페이지 = Math.ceil(총글개수 / 글당개수);

    // 현재 페이지에 해당하는 글 가져오기 (skip과 limit 사용)
    const result = await db.collection('post')
      .find()
      .sort({ _id: -1 })  // 최신 글 먼저
      .skip((현재페이지 - 1) * 글당개수)
      .limit(글당개수)
      .toArray();

    res.render('list.ejs', {
      글목록: result,
      총페이지: 총페이지,
      현재페이지: 현재페이지
    });
  } catch (err) {
    console.log(err);
    res.status(500).send('서버 에러');
  }
});


app.get('/write', (req, res) => {
  res.render('write.ejs');
});


app.get('/detail/:id', async (req, res) => {
  try {
    let result = await db.collection('post').findOne({ _id: new ObjectId(req.params.id) });

    // concept 데이터를 배열로 변환
    const concepts = result.concept ? result.concept : [];

    // country 데이터를 배열로 변환
    const countries = result.country ? result.country : [];

    // lodgingtype 데이터를 배열로 변환
    const lodgingtypes = result.lodgingtype ? result.lodgingtype : [];

    // expenses 데이터를 배열로 변환
    const expenses = result.expenses ? result.expenses : [];

    // period 데이터를 배열로 변환
    const periods = result.period ? result.period : [];

    res.render('detail', { 
      result: result, 
      concepts: concepts, 
      countries: countries, 
      lodgingtypes: lodgingtypes, 
      expenses: expenses, 
      periods: periods 
    });
  } catch (err) {
    console.error('Error fetching post:', err);
    res.status(500).send('Server error');
  }
});



const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

app.post('/add', async (req, res) => {
  try {
    const { groomname, bridename } = req.body;

    // 현재 시간을 한국 시간으로 변환
    const createdAt = dayjs().tz('Asia/Seoul').format('YYYY/MM/DD'); // 여기서 날짜 포맷 지정

    const result = await db.collection('post').insertOne({
      groomname,
      bridename,
      createdAt // 한국 시간으로 저장 (YYYY/MM/DD 포맷)
    });
    res.redirect(`/list/1`);
  } catch (e) {
    console.log(e);
    res.status(500).send('서버 에러');
  }
});



app.delete('/delete', ensureAuthenticated, async (req, res) => {
  // console.log(req.query);
  await db.collection('post').deleteOne({ _id: new ObjectId(req.query.docid) });
  res.send('삭제완료');
});

passport.use(new LocalStrategy(async (username, password, done) => {
  let result = await db.collection('user').findOne({ username: username });
  if (!result) {
    return done(null, false, { message: '일치하는 ID가 없습니다' });
  }

  if (await bcrypt.compare(password, result.password)) {
    return done(null, result);
  } else {
    return done(null, false, { message: '비번불일치' });
  }
}));


passport.serializeUser((user, done) => {
  process.nextTick(() => {
    done(null, { id: user._id, username: user.username });
  });
});


passport.deserializeUser(async (user, done) => {
  let result = await db.collection('user').findOne({ _id: new ObjectId(user.id) });
  delete result.password;
  process.nextTick(() => {
    done(null, result);
  });
});


app.get('/login', redirectIfAuthenticated, (req, res) => {
  // console.log(req.user);
  res.render('login.ejs');
});


app.post('/login', (req, res, next) => {
  passport.authenticate('local', (error, user, info) => {
    if (error) return res.status(500).json(error);
    if (!user) return res.status(401).json(info.message);
    req.logIn(user, (err) => {
      if (err) return next(err);
      res.redirect('/list/1');
    });
  })(req, res, next);
});


app.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) {
      return next(err);
    }
    res.redirect('/login');
  });
});


// 수정페이지

// gatherFields 함수 정의
const gatherFields = (prefix, body) => {
  return Object.keys(body)
    .filter(key => key.startsWith(prefix))
    .map(key => body[key]);
};

app.get('/edit/:id', async (req, res) => {
  try {
    let result = await db.collection('post').findOne({ _id: new ObjectId(req.params.id) });
    // console.log(result);
    res.render('edit', { result: result });
  } catch (err) {
    console.error('게시물을 가져오는 중 오류 발생:', err);
    res.status(500).send('서버 내부 오류');
  }
});


// 데이터를 업데이트하는 POST 라우트
app.post('/edit/:id', async (req, res) => {
  try {
    // console.log('Request Body:', req.body); // 디버깅을 위해 추가

    let updateData = {
      groomtravel: req.body.groomtravel,
      groomnumber: req.body.groomnumber,
      bridetravel: req.body.bridetravel,
      bridenumber: req.body.bridenumber,
      groomtype: gatherFields('groomtype', req.body),
      bridetype: gatherFields('bridetype', req.body),
      concept: gatherFields('concept', req.body),
      country: gatherFields('country', req.body),
      lodgingtype: gatherFields('lodgingtype', req.body),
      expenses: gatherFields('expenses', req.body),
      period: gatherFields('period', req.body),
      request: req.body.request
    };

    let result = await db.collection('post').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );
    // console.log(result);
    res.redirect('/list/1');
  } catch (err) {
    console.error('게시물 업데이트 중 오류 발생:', err);
    res.status(500).send('서버 내부 오류');
  }
});




// 회원가입    ※ 지우면 안됌
// app.get('/register', (req, res) => {
//   res.render('register.ejs');
// });

// app.post('/register', async (req, res) => {
//   let hash = await bcrypt.hash(req.body.password, 10);

//   await db.collection('user').insertOne({
//     username: req.body.username,
//     password: hash
//   });
//   res.redirect('/login');
// });



// 전체 데이터 통계 차트 라우트
app.get('/chart', async (req, res) => {
  try {
    const results = await db.collection('post').find().toArray();

    // 콘셉트 카운트 초기화
    const conceptCounts = {
      '호캉스형': 0,
      '탐방형': 0,
      '은둔형': 0,
      '방랑형': 0,
      '황제형': 0,
      '체험형': 0,
      '쇼핑형': 0
    };

    // country 카운트 초기화
    const countryCounts = {
      '단거리 4-5시간 내외': 0,
      '단거리 5-7시간 내외': 0,
      '중거리 8-11시간 내외': 0,
      '장거리 10-13시간 내외': 0,
      '장거리 및 경유 14-24시간 내외': 0,
      '중/장거리 경유무관': 0
    };

    // 숙소 타입 카운트 초기화
    const lodgingCounts = {
      '상관없다': 0,
      '호텔': 0,
      '리조트': 0,
      '수상가옥': 0
    };

    // 비용 카운트 초기화
    const expensesCounts = {
      '가성비형': 0,
      '절충형': 0,
      '럭셔리형': 0,
      '돈이문제냐': 0,
      '생각없다': 0
    };

    // 기간 카운트 초기화
    const periodCounts = {
      '5일 이하': 0,
      '6 ~ 8일': 0,
      '9일 이상': 0
    };

    // 데이터 처리
    results.forEach(result => {
      // 콘셉트 처리
      if (result.concept && Array.isArray(result.concept)) {
        result.concept.forEach(conceptValue => {
          if (conceptValue.includes('호캉스형')) conceptCounts['호캉스형']++;
          if (conceptValue.includes('탐방형')) conceptCounts['탐방형']++;
          if (conceptValue.includes('은둔형')) conceptCounts['은둔형']++;
          if (conceptValue.includes('방랑형')) conceptCounts['방랑형']++;
          if (conceptValue.includes('황제형')) conceptCounts['황제형']++;
          if (conceptValue.includes('체험형')) conceptCounts['체험형']++;
          if (conceptValue.includes('쇼핑형')) conceptCounts['쇼핑형']++;
        });
      }

      // 국가 처리
      if (result.country && Array.isArray(result.country)) {
        result.country.forEach(countryValue => {
          if (countryValue.includes('단거리 4-5시간 내외')) countryCounts['단거리 4-5시간 내외']++;
          if (countryValue.includes('단거리 5-7시간 내외')) countryCounts['단거리 5-7시간 내외']++;
          if (countryValue.includes('중거리 8-11시간 내외')) countryCounts['중거리 8-11시간 내외']++;
          if (countryValue.includes('장거리 10-13시간 내외')) countryCounts['장거리 10-13시간 내외']++;
          if (countryValue.includes('장거리 및 경유 14-24시간 내외')) countryCounts['장거리 및 경유 14-24시간 내외']++;
          if (countryValue.includes('중/장거리 경유무관')) countryCounts['중/장거리 경유무관']++;
        });
      }

      // 숙소 타입 처리
      if (result.lodgingtype && Array.isArray(result.lodgingtype)) {
        result.lodgingtype.forEach(lodgingValue => {
          if (typeof lodgingValue === 'string') {
            if (lodgingValue.includes('호텔')) lodgingCounts['호텔']++;
            if (lodgingValue.includes('리조트')) lodgingCounts['리조트']++;
            if (lodgingValue.includes('수상가옥')) lodgingCounts['수상가옥']++;
            if (lodgingValue.includes('상관없다')) lodgingCounts['상관없다']++;
          } else {
            console.warn("유효하지 않은 lodgingValue:", lodgingValue); // 유효하지 않은 값 경고 출력
          }
        });
      }

      // 비용 처리
      if (result.expenses && Array.isArray(result.expenses)) {
        result.expenses.forEach(expensesValue => {
          if (typeof expensesValue === 'string') {
            if (expensesValue.includes('가성비형')) expensesCounts['가성비형']++;
            if (expensesValue.includes('절충형')) expensesCounts['절충형']++;
            if (expensesValue.includes('럭셔리형')) expensesCounts['럭셔리형']++;
            if (expensesValue.includes('돈이문제냐')) expensesCounts['돈이문제냐']++;
            if (expensesValue.includes('생각없다')) expensesCounts['생각없다']++;
          } else {
            console.warn("유효하지 않은 expensesValue:", expensesValue); // 유효하지 않은 값 경고 출력
          }
        });
      }

      // 기간 처리
      if (result.period && Array.isArray(result.period)) {
        result.period.forEach(periodValue => {
          if (typeof periodValue === 'string') {
            if (periodValue.includes('5일 이하')) periodCounts['5일 이하']++;
            if (periodValue.includes('6 ~ 8일')) periodCounts['6 ~ 8일']++;
            if (periodValue.includes('9일 이상')) periodCounts['9일 이상']++;
          } else {
            console.warn("유효하지 않은 periodValue:", periodValue); // 유효하지 않은 값 경고 출력
          }
        });
      }
    });

    // 차트를 위한 데이터 전송
    res.render('chart', {
      concepts: JSON.stringify(conceptCounts),
      countries: JSON.stringify(countryCounts),
      lodgings: JSON.stringify(lodgingCounts),
      expenses: JSON.stringify(expensesCounts),
      periods: JSON.stringify(periodCounts)
    });
  } catch (e) {
    console.error("차트 데이터를 가져오는 중 오류 발생:", e);
    res.status(500).send('서버 에러');
  }
});








app.get('/contact', (req, res) => {
  res.render('contact.ejs'); 
});

app.get('/contact-list', async (req, res) => {
  res.redirect('/contact-list/1');
});

app.get('/contact-list/:id', async (req, res) => {
  const 글개수당 = 5;
  const 현재전화상담페이지 = parseInt(req.params.id) || 1;

  try {
    const 총전화상담글개수 = await db.collection('contact').countDocuments();

    const 총전화상담페이지 = Math.ceil(총전화상담글개수 / 글개수당);

    const contactResult = await db.collection('contact')
      .find()
      .sort({_id: -1})
      .skip((현재전화상담페이지 - 1) * 글개수당)
      .limit(글개수당)
      .toArray();

    res.render('contact-list.ejs', {
      상담목록: contactResult,
      총전화상담페이지: 총전화상담페이지,
      현재전화상담페이지: 현재전화상담페이지
    });
  } catch (err) {
    console.log(err);
    res.status(500).send('서버 에러');
  }

});


app.get('/thankyou', (req, res) => {
  res.render('thankyou.ejs'); 
});


app.get('/contact-write', (req, res) => {
  res.render('contact-write.ejs'); 
});


app.post('/contact-add', async (req, res) => {
    await db.collection('contact').insertOne({ groomClient: req.body.groomClient, brideClient: req.body.brideClient, counseling: req.body.counseling, agonize: req.body.agonize });
    res.redirect('contact-list/1');
    // console.log(req.body)
});


app.get('/contact-detail/:id', async (req, res) => {
  let contactResult = await db.collection('contact').findOne({ _id : new ObjectId(req.params.id) })
  // console.log(req.params)
  res.render('contact-detail.ejs', { contactResult : contactResult })
});



// ★★★★★★★   contact 수정기능   ★★★★★★★

app.get('/contact-edit/:id', async (req, res) => {   //findOne 값을 찾을때 쓰는거
  let contactResult = await db.collection('contact').findOne({ _id : new ObjectId(req.params.id) })
  // console.log(contactResult) 
  res.render('contact-edit.ejs', { contactResult : contactResult })
})

app.post('/contact-edit', async (req, res) =>{ //updateOne 값을 변경할때 쓰는거
  await db.collection('contact').updateOne({ _id : new ObjectId(req.body.id) }, { $set : {counseling : req.body.counseling, agonize : req.body.agonize} })
  // console.log(req.body)
  res.redirect('/thankyou')
})


// ★★★★★★★   contact 삭제기능   ★★★★★★★

app.delete('/contact-delete', async (req, res) => {
  await db.collection('contact').deleteOne({ _id : new ObjectId(req.query.docid) })
  res.send('삭제완료')
})

