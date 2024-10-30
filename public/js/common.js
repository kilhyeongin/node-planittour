$(document).ready(function() {
    var groomYes = document.getElementById('groom-yes');
    var groomNo = document.getElementById('groom-no');
    var groomNumber = document.getElementById('groom-number-label');
    var brideYes = document.getElementById('bride-yes');
    var brideNo = document.getElementById('bride-no');
    var brideNumber = document.getElementById('bride-number-label');
    var travelTypeSection = document.getElementById('travel-type-section');
    var groomTravelType = document.getElementById('groom-travel-type');
    var brideTravelType = document.getElementById('bride-travel-type');

    function toggleTravelTypeSection() {
        var showGroomType = groomYes.checked;
        var showBrideType = brideYes.checked;

        groomTravelType.style.display = showGroomType ? 'flex' : 'none';
        groomNumber.style.display = showGroomType ? 'flex' : 'none';
        brideTravelType.style.display = showBrideType ? 'flex' : 'none';
        brideNumber.style.display = showBrideType ? 'flex' : 'none';
        
        travelTypeSection.style.display = (showGroomType || showBrideType) ? 'block' : 'none';
    }

    groomYes.addEventListener('change', toggleTravelTypeSection);
    groomNo.addEventListener('change', toggleTravelTypeSection);
    brideYes.addEventListener('change', toggleTravelTypeSection);
    brideNo.addEventListener('change', toggleTravelTypeSection);

    document.getElementById('groom-yes').addEventListener('change', function() {
        document.getElementById('result').disabled = !this.checked;
    });

    document.getElementById('groom-no').addEventListener('change', function() {
        document.getElementById('result').disabled = this.checked;
        if (this.checked) {
            document.getElementById('result').value = 0;
            
            for (var i = 1; i <= 3; i++) {
                $('.groomtype' + i).removeClass('on');
            }
        }
    });

    document.getElementById('bride-yes').addEventListener('change', function() {
        document.getElementById('result2').disabled = !this.checked;
    });

    document.getElementById('bride-no').addEventListener('change', function() {
        document.getElementById('result2').disabled = this.checked;
        if (this.checked) {
            document.getElementById('result2').value = 0;
            
            for (var i = 1; i <= 3; i++) {
                $('.bridetype' + i).removeClass('on');
            }
        }
    });



    // jQuery 부분
    $('.groom-yes').click(function(){
        $(this).addClass('on');
        $('.groom-no').removeClass('on');
    });

    $('.groom-no').click(function(){
        $(this).addClass('on');
        $('.groom-yes').removeClass('on');
    });

    $('.bride-yes').click(function(){
        $(this).addClass('on');
        $('.bride-no').removeClass('on');
    });

    $('.bride-no').click(function(){
        $(this).addClass('on');
        $('.bride-yes').removeClass('on');
    });

    for (var i = 1; i <= 3; i++) {
        (function(i) {
            $('#groomtype' + i).click(function() {
                $('.groomtype' + i).toggleClass('on');
            });
        })(i);
    }

    for (var i = 1; i <= 3; i++) {
        (function(i) {
            $('#bridetype' + i).click(function() {
                $('.bridetype' + i).toggleClass('on');
            });
        })(i);
    }

    for (var i = 1; i <= 7; i++) {
        (function(i) {
            $('#concept' + i).click(function() {
                $('.concept' + i).toggleClass('on');
            });
        })(i);
    }

    for (var i = 1; i <= 6; i++) {
        (function(i) {
            $('#country' + i).click(function() {
                $('.country' + i).toggleClass('on');
            });
        })(i);
    }

    for (var i = 1; i <= 4; i++) {
        (function(i) {
            $('#type' + i).click(function() {
                $('.type' + i).toggleClass('on');
            });
        })(i);
    }

    for (var i = 1; i <= 5; i++) {
        (function(i) {
            $('#expenses' + i).click(function() {
                $('.expenses' + i).toggleClass('on');
            });
        })(i);
    }

    for (var i = 1; i <= 3; i++) {
        (function(i) {
            $('#period' + i).click(function() {
                $('.period' + i).toggleClass('on');
            });
        })(i);
    }

    // 다음 버튼 클릭 이벤트



    $('.next-form').click(function(){
        $('.client-img').css('display','none');
        $('.edit-myform').css('display','block');
        $('.experience-all').css('display','block');
    });

    $('.next-concept').click(function(){
        $('.experience-all').css('display','none');
        $('.travel-concept').css('display','flex');
    });

    $('.prev-experience').click(function(){
        $('.travel-concept').css('display','none');
        $('.experience-all').css('display','block');
    });

    $('.next-country').click(function(){
        $('.travel-concept').css('display','none');
        $('.want-country').css('display','flex');
    });

    $('.prev-concept').click(function(){
        $('.want-country').css('display','none');
        $('.travel-concept').css('display','flex');
    });

    $('.next-lodging').click(function(){
        $('.want-country').css('display','none');
        $('.lodging-type').css('display','flex');
    });

    $('.prev-country').click(function(){
        $('.lodging-type').css('display','none');
        $('.want-country').css('display','flex');
    });

    $('.next-expenses').click(function(){
        $('.lodging-type').css('display','none');
        $('.travel-expenses').css('display','flex');
    });

    $('.prev-type').click(function(){
        $('.travel-expenses').css('display','none');
        $('.lodging-type').css('display','flex');
    });

    $('.next-period').click(function(){
        $('.travel-expenses').css('display','none');
        $('.travel-period').css('display','flex');
    });

    $('.prev-expenses').click(function(){
        $('.travel-period').css('display','none');
        $('.travel-expenses').css('display','flex');
    });

    $('.next-request').click(function(){
        $('.travel-period').css('display','none');
        $('.additional-request, .form-btn').css('display','flex');
    });

    $('.prev-request').click(function(){
        $('.additional-request, .form-btn').css('display','none');
        $('.travel-period').css('display','flex');
    });

    $('.form-btn button').click(function(){
        $('.all-control').addClass('on')
    })


});


function count(type, result)  {
    const resultElement = document.getElementById(result);
    let number = parseInt(resultElement.value);
    
    if(type === 'plus') {
      number = number + 1;
    }else if(type === 'minus' && number > 0)  {
      number = number - 1;
    }
    
    resultElement.value = number;
  }


  function count2(type, result2)  {
    const resultElement2 = document.getElementById(result2);
    let number2 = parseInt(resultElement2.value);
    
    if(type === 'plus2') {
      number2 = number2 + 1;
    }else if(type === 'minus2' && number2 > 0)  {
      number2 = number2 - 1;
    }
    
    resultElement2.value = number2;
  }


    // select 클릭 시 옵션 박스를 열고 닫기
    document.querySelector('.select-click').addEventListener('click', function() {
        const selectBox = this.closest('.select-box');
        selectBox.classList.toggle('on');
    });

    document.querySelectorAll('.option-box .option').forEach(function(option) {
        option.addEventListener('click', function() {
            const selectBox = this.closest('.select-box');
            const selectChoice = selectBox.querySelector('.select-choice');
            
            // 선택한 옵션의 value를 select-choice의 value에 설정
            const selectedValue = this.getAttribute('value');
            
            // input의 value 속성 및 속성(attribute) 모두 변경
            selectChoice.value = selectedValue;
            selectChoice.setAttribute('value', selectedValue); // HTML 속성도 업데이트

            // 옵션 박스를 닫기
            selectBox.classList.remove('on');
            console.log("선택된 값:", selectChoice.value); // 값이 제대로 들어갔는지 콘솔에 출력
        });
    });

    // 폼 제출 시 입력 확인
    document.querySelector('form').addEventListener('submit', function(e) {
        const input = document.querySelector('.select-choice');
        console.log("제출된 값:", input.value); // 제출되는 값 확인
    });



document.querySelectorAll('.choice-btn .A-type, .choice-btn .B-type').forEach((type) => {
    type.addEventListener('click', function() {
        const isAType = type.classList.contains('A-type');
        const otherType = isAType ? document.querySelector('.choice-btn .B-type') : document.querySelector('.choice-btn .A-type');

        // 선택된 타입에 클래스 추가 및 체크 설정
        type.classList.add('on');
        type.querySelector('input[type="radio"]').checked = true;

        // 다른 타입의 클래스 제거 및 체크 해제
        otherType.classList.remove('on');
        otherType.querySelector('input[type="radio"]').checked = false;
    });
});






