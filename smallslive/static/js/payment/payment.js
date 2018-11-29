function renderPayPal(paypal) {
  paypal.Button.render({
    // Configure environment
    env: 'sandbox',
    client: {
      sandbox: 'AZjFfKVUvv8BWED4z-wJVElDiPiYe3oCXVQ8BV3KrmZ_lRw7G6ohCxBuz-0L3bW_AKIY-aYhZjTYklET',
      production: 'demo_production_client_id'
    },
    // Customize button (optional)
    locale: 'en_US',
    style: {
      label: 'pay',
      size: 'responsive',
      color: 'white',
      shape: 'rect',
    },
    // Set up a payment
    payment: function(data, actions) {
      return actions.payment.create({
        transactions: [{
          amount: {
            total: '0.01',
            currency: 'USD'
          }
        }]
      });
    },
    // Execute the payment
    onAuthorize: function(data, actions) {
      return actions.payment.execute().then(function() {
        $('#place-order').submit();
        return;

        $.ajax({
          type: "POST",
          url: $supporterForm.attr('action'),
          data: $supporterForm.serialize(),
          success: function (data) {
            if(typeof completeSubpage !== "undefined"){
              console.log("Works?")
              notCompleteContainer.html("")
              var flowCompleteSubpage = window.subpages.get(completeSubpage);
              flowCompleteSubpage.load();
            }
            else{
              window.location = data.location
            }
          },
          error: function () {
          }
        });

      });
    },
    onError: function (err) {
      console.log(err);
    }
  }, '#paypal-button');
}

function renderCardAnimation(selector) {

  var selector = selector || '#formSupporter';

  var card = new Card({
    form: selector,
    formSelectors: {
        expiryInput: '#expiry-month, #expiry-year'
    },
    container: '.card-wrapper'
  });
}

function startStripePayment($form, action_url, completeSubpage) {
  var stripeResponseHandler = function (status, response) {
    if (response.error) {
      // Show the errors on the form
      // TODO Display payment errors
      $('#form-general-error').text(response.error.message);
      $form.find('.submit-button').prop('disabled', false).removeClass('disabled');
    } else {
      // token contains id, last4, and card type
      var token = response.id;
      // Insert the token into the form so it gets submitted to the server
      $form.append($('<input type="hidden" name="stripe_token" />').val(token));
      // and submit

      $.ajax({
        type: "POST",
        url: action_url,
        data: $form.serialize(),
        success: function (data) {
          if(typeof completeSubpage !== "undefined" && completeSubpage){
            //notCompleteContainer.html("")
            var flowCompleteSubpage = window.subpages.get(completeSubpage);
            flowCompleteSubpage.load();
          }
          else{
            window.location = data.location
          }
        },
        error: function () {
        }
      });
    }
  };
  Stripe.card.createToken($form, stripeResponseHandler);
}

function startPayPalPayment($form,  action_url, completeSubpage) {
  $.ajax({
    type: "POST",
    url: action_url,
    data: $form.serialize(),
    success: function (data) {
      if(typeof completeSubpage !== "undefined" && completeSubpage){
        //notCompleteContainer.html("")
        var flowCompleteSubpage = window.subpages.get(completeSubpage);
        flowCompleteSubpage.load();
      }
      else{
        window.location = data.payment_url
      }
    },
    error: function () {
    }
  });
}