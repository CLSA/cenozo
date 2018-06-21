// Custom functionality to allow answers to be selected using the number pad
$(document).ready(function() {
  $("*").keydown(function(event) {
    // This will get fired twice on every keypress, one from a target with no parent element and another time
    // from a target with a parent element.  So to prevent double-processing we'll ignore when the target has
    // a parent elemtn
    if( null == event.currentTarget.parentElement ) {
      if( 13 == event.which ) {
        // enter key, click on the next button
        $( "#ls-button-submit" ).click();
      } else if( 96 <= event.which && event.which <= 105 ) {
        // translate from key code to number then click the appropriate radio/checkbox
        var num = event.which - 97;
        $( "input[type=radio]:eq(" + num + "), input[type=checkbox]:eq(" + num + ")" ).click();
      }
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
//   integer minAnswers: the minimum number of questions that must be answered (optional, default all)
//   function validateInput: A custom function which will be passed the answer and whether
function configureQuestion( params ) {
  var lang = $('html').attr('lang');
  [ 'qid', 'formElementType', 'dontKnowCode', 'refuseCode' ].forEach( function( paramName ) {
    if( undefined === params[paramName] ) {
      throw new Error( arguments.callee.name + ' expects ' + paramName + ' as an input parameter' );
    }
  } );
  if( undefined === params.refuse ) params.refuse = false;
  if( undefined === params.minAnswers ) params.minAnswers = null;
  if( undefined === params.validateInput ) params.validateInput = function( answer, multi ) { return false; };

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
        // check for valid input
        var answers = 0;
        for( var i = 0; i < inputList.length; i++ ) // can't use array functions since inputList isn't an array
          if( 0 < inputList[i].value.length ) answers++;

        if( null == params.minAnswers && inputList.length > answers ) {
          var multi = 1 < inputList.length;
          alert(
            'en' == lang
            ? 'Please provide a response' + ( multi ? ' for all questions.' : '.' )
            : 'Veuillez fournir une réponse' + ( multi ? ' pour toutes les questions.' : '.' )
          );
        } else if( null != params.minAnswers && params.minAnswers > answers ) {
          alert(
            'en' == lang
            ? 'Please provide a response for at least ' + params.minAnswers + ' question(s).'
            : 'Veuillez fournir une réponse pour au moins ' + params.minAnswers + ' question(s).'
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
//   integer minAnswers: the minimum number of questions that must be answered (optional, default all)
//   boolean refuse: whether to add a drop-down with don't-know/refuse (optional, default false)
//   
function configureNumberQuestion( params ) {
  var lang = $('html').attr('lang');
  if( undefined === params.min ) throw new Error( 'configureQuestion expects min as an input parameter' );
  if( undefined === params.max ) throw new Error( 'configureQuestion expects max as an input parameter' );
  var digits = params.max.toString().length;

  configureQuestion( {
    qid: params.qid,
    formElementType: 'input',
    dontKnowCode: '9'.repeat( digits )-1,
    refuseCode: '9'.repeat( digits ),
    refuse: params.refuse,
    minAnswers: params.minAnswers,
    validateInput: function( inputList ) {
      var error = false;

      for( var i = 0; i < inputList.length; i++ ) { // can't use array functions since inputList isn't an array
        if( 0 < inputList[i].value.length ) {
          var answer = parseFloat( inputList[i].value );

          if( answer != inputList[i].value ) {
            error = 'en' == lang
                  ?  'Please specify your answer as a number only.'
                  : 'Veuillez donner une réponse sous forme de nombre seulement.';
          } else if( answer < params.min ) {
            error = 'en' == lang
                  ? 'Your answer must be bigger than or equal to ' + params.min + '.'
                  : 'Votre réponse doit être supérieure ou égale à ' + params.min + '.';
          } else if( answer > params.max ) {
            error = 'en' == lang
                  ? 'Your answer must be smaller than or equal to ' + params.max + '.'
                  : 'Votre réponse doit être inférieure ou égale à ' + params.max + '.';
          }
        }
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
    refuse: true,
    minAnswers: params.minAnswers
  } );
}
