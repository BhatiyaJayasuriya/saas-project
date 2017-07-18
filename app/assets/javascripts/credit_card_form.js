/* global $ */
/*global Stripe*/
// function to get params from url ('free' or 'premium' in our case)
function GetURLParameter(sParam) {
  var sPageURL = window.location.search.substring(1);
  var sURLVariables = sPageURL.split('&');
  for (var i = 0; i < sURLVariables.length; i++) {
    var sParameterName = sURLVariables[i].split('=');
    if (sParameterName[0] == sParam) {
      return sParameterName[1];
    }
  }
};

$(document).ready(function() {

var show_error, stripeResponseHandler, submitHandler;

// function to handle form submission and intercept the default rails event (which is creating the
// account, we need to stop the process until we get the token from stripe)
  submitHandler = function(event) { // referance what has triggered this event
    var $form = $(event.target);
    $form.find("input[type=submit]").prop("disabled", true); // disable the button
    if (Stripe) {
      Stripe.card.createToken($form, stripeResponseHandler);
    } else {
      show_error("Failed to load credit card processing functionality. Please reload the page");
    }
    return false;
  };


// initiate submit handler listener for any form with class cc_form
  $('.cc_form').on('submit', submitHandler);

// handle event of plan drop down changing
  var handlePlanChange = function(plan_type, form) {
    var $form = $(form);
    if (plan_type == undefined) { // == equity using type conversion
      plan_type = $("#tenant_plan :selected").val(); // this the id='tenant_plan' from drop down & the selected one
    }
    
    if (plan_type === 'premium') { // === equity without type conversion
      $("[data-stripe]").prop('required', true); // strip data is required because we need to handle payment
      $form.off('submit'); // remove the event handle attached to $form currently
      $form.on('submit', submitHandler);
      $("[date-stripe]").show();
    } else {
      $("[data-stripe]").hide();
      $form.off("submit");
      $("[data-stripe]").removeProp('required');
    }
  }
  
// set up plan change event listener #tenant_plan id in the forms for class cc_form
  $("#tenant_plan").on("change", function(event) {
    handlePlanChange($("#tenant_plan :selected").val(), ".cc_form");
  });

// call plan change handler so that plan is set correctly in the drop down when page loads
  handlePlanChange(GetURLParameter('plan'), '.cc_form');

// function to handle response token received from stripe and remove cc filed info
  stripeResponseHandler = function(status, response) {
    var token, $form;
    
    if (response.error) {
      console.log(response.error.message);
      show_error(response.error.message);
      $form.find('input[type=submit]').prop('disabled', false);
    } else {
      $form.append($("<input type='hidden' name='payment[token]' />").val(token));
      $("[data-strip=number]").remove();
      $("[data-stripe=cvv]").remove();
      $("[data-stripe=exp-year]").remove();
      $("[data-stripe=exp-month]").remove();
      $("[data-stripe=label]").remove();
      $form.get(0).submit(); //re submit form 
    }
    return false;
  };

// function to show errors when stripe functionality returns an error
  show_error = function(message) {
    if ($("#flash-messages").size() < 1) {
      $("div.container.main div:first").prepend(
        "<div id='flash-messages'></div>");
    }
    $("#flash-messages").html(
      '<div class="alert alert-warning"><a class="close" data-dismiss="alert">×</a><div id="flash_alert">' +
        message +
        "</div></div>"
    );
    $(".alert").delay(5000).fadeOut(3000);
    return false;
  };
});