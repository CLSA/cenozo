// Custom functionality to allow answers to be selected using the number pad
var compound_number = "";
$(document).ready(function() {
  $("*").keydown(function(event) {
    if( 13 == event.which ) {
      // enter key, click on the next button
      $( "#ls-button-submit" ).click();
    } else if( 96 <= event.which && event.which <= 105 ) {
      // translate from key code to number, then append to the compound number
      var num = event.which - 96;
      if( 1 == compound_number.length ) compound_number += num.toString();
      else compound_number = num.toString();
      num = parseInt( compound_number ) - 1;

      // select either a special response (97, 98 and 99) or the Nth radio box
      var selector = "97" == compound_number
                   ? "input[value^=OT]"
                   : "98" == compound_number
                   ? "input[value^=DK]"
                   : "99" == compound_number
                   ? "input[value^=RE]"
                   : "input[type=radio]:eq(" + num + ")";
      $( selector ).click();

      // select either a special response (97, 98 and 99) or the Nth radio box
      var selector = "97" == compound_number
                   ? "input[name$=OT]"
                   : "98" == compound_number
                   ? "input[name$=DK]"
                   : "99" == compound_number
                   ? "input[name$=RF]"
                   : "input[type=checkbox]:eq(" + num + ")";
      $( selector ).click();
    }
  });
});

// Custom functionality to allow additional runtime features to questions
// expecting the input param as an object with:
//   integer qid: the question ID (mandatory)
//   string formElementType: the type of form element to affect (input, textarea, etc)
//   string dontKnowCode: the answer to put if the user chooses "don't know"
//   string refuseCode: the answer to put if the user chooses "refuse"
//   boolean refuse: whether to add a drop-down with don't-know/refuse (optional, default false)
//   function validateAnswer: A custom function which will be passed the answer and whether
function configureQuestion( params ) {
  var lang = $('html').attr('lang');
  [ 'qid', 'formElementType', 'dontKnowCode', 'refuseCode' ].forEach( function( paramName ) {
    if( undefined === params[paramName] ) {
      throw new Error( arguments.callee.name + ' expects ' + paramName + ' as an input parameter' );
    }
  } );
  if( undefined === params.refuse ) params.refuse = false;
  if( undefined === params.validateAnswer ) params.validateAnswer = function( answer, multi ) { return false; };

  $(document).on('ready pjax:complete',function() {
    if( params.refuse ) {
      var inputList = $('#question' + params.qid + ' ' + params.formElementType);

      var otherOptions = $(
        '<div style="margin-bottom:1em">' +
          '<select id="otherOptions" class="form-control">' +
            '<option value="" selected>(' +
              ( 'en' == lang ? 'other options' : 'autres options' ) +
            ')</option>' +
            '<option value="dontKnow">' +
              ( 'en' == lang ? 'Don\'t Know' : 'Ne sait pas' ) +
            '</option>' +
            '<option value="refuse">' +
              ( 'en' == lang ? 'Refuse' : 'Refus' ) +
            '</option>' +
          '</select>' +
        '</div>'
      );
      otherOptions.find( 'select' ).change( function() {
        var otherOption = this.options[this.selectedIndex].value;
        var disabled = 'dontKnow' == otherOption || 'refuse' == otherOption;
        inputList.prop( 'disabled', disabled );
        if( disabled ) inputList.val('');
      } );
      inputList.last().parent().after( otherOptions );

      if( params.dontKnowCode == inputList.last().val() ) {
        otherOptions.find( 'select' ).val( 'dontKnow' ).trigger( 'change' );
      } else if( params.refuseCode == inputList.last().val() ) {
        otherOptions.find( 'select' ).val( 'refuse' ).trigger( 'change' );
      }
    }

    function customValidate() {
      var proceed = false;

      var inputList = $('#question' + params.qid + ' ' + params.formElementType);
      if( params.refuse ) {
        // convert don't-know/refuse answers
        var otherOption = otherOptions.find( 'select' ).find(':selected').val();
        if( 'dontKnow' == otherOption ) {
          inputList.val( params.dontKnowCode );
          inputList.prop( 'disabled', false );
          proceed = true;
        } else if( 'refuse' == otherOption ) {
          inputList.val( params.refuseCode );
          inputList.prop( 'disabled', false );
          proceed = true;
        }
      }

      if( !proceed ) {
        // check for invalid input
        if( 0 == inputList.val().length ) {
          var multi = 1 < inputList.length;
          alert(
            'en' == lang
            ? 'Please provide a response' + ( multi ? ' for all questions.' : '.' )
            : 'Veuillez fournir une réponse' + ( multi ? ' pour toutes les questions.' : '.' )
          );
        } else {
          var error = params.validateInput( inputList );
          if( error ) {
            alert( error );
          } else {
            proceed = true;
          }
        }
      }

      if( proceed && 'function' === typeof params.onSubmit ) proceed = params.onSubmit();
      return proceed;
    }

    // do some validation when submitting the form
    $('#ls-button-submit').click( customValidate );
    $('input').keypress(
      function( event ) { if( event.which == '13' ) if( !customValidate() ) event.preventDefault(); }
    );
  } );
}
// Custom functionality to allow additional runtime features to questions
// expecting the input param as an object with:
//   integer qid: the question ID (mandatory)
//   integer min: the minimum value allowed (mandatory)
//   integer max: the maximum value allowed (mandatory)
//   boolean refuse: whether to add a drop-down with don't-know/refuse (optional, default false)
function configureNumberQuestion( params ) {
  var lang = $('html').attr('lang');
  if( undefined === params.min ) throw new Error( 'configureQuestion expects min as an input parameter' );
  if( undefined === params.max ) throw new Error( 'configureQuestion expects max as an input parameter' );
  var digits = params.max.toString().length;

  configureQuestion( {
    qid: params.qid,
    formElementType: 'input',
    dontKnowCode: parseInt( ''.padEnd(digits,9) )-1, // ...98
    refuseCode: parseInt( ''.padEnd(digits,9) ), // ...99
    refuse: params.refuse,
    validateInput: function( inputList ) {
      var error = false;
      var answer = parseFloat( inputList.val() );
      var multi = 1 < inputList.length;
      if( answer != inputList.val() ) {
        error = 'en' == lang
              ? (
                multi
                ? 'Please specify your answers as numbers only.'
                : 'Please specify your answer as a number only.'
              ) : (
                multi
                ? 'Veuillez donner des réponses sous forme de nombres seulement.'
                : 'Veuillez donner une réponse sous forme de nombre seulement.'
              );
      } else if( answer < params.min ) {
        error = 'en' == lang
              ? 'Your answer' + ( multi ? 's' : '' ) + ' must be bigger than or equal to ' + params.min + '.'
              : (
                multi
                ? 'Vos réponses doivent être supérieures ou égales à ' + params.min + '.'
                : 'Votre réponse doit être supérieure ou égale à ' + params.min + '.'
              );
      } else if( answer > params.max ) {
        error = 'en' == lang
              ? 'Your answer' + ( multi ? 's' : '' ) + ' must be smaller than or equal to ' + params.max + '.'
              : (
                multi
                ? 'Vos réponses doivent être inférieures ou égales à ' + params.max + '.'
                : 'Votre réponse doit être inférieure ou égale à ' + params.max + '.'
              );
      }
      return error;
    }
  } );
}

// Custom functionality to allow additional runtime features to questions
// expecting the input param as an object with:
//   integer qid: the question ID (mandatory)
function configureTextQuestion( params ) {
  configureQuestion( {
    qid: params.qid,
    formElementType: 'textarea',
    dontKnowCode: 98,
    refuseCode: 99,
    refuse: true
  } );
}

// Custom functionality to allow additional runtime features to questions
// expecting the input param as an object with:
//   integer qid: the question ID (mandatory)
function configureShortTextQuestion( params ) {
  configureQuestion( {
    qid: params.qid,
    formElementType: 'input',
    dontKnowCode: 98,
    refuseCode: 99,
    refuse: true
  } );
}
