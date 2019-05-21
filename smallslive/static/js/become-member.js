var selectedData = {
  type: "",
  amount: 0
};

var setSelected = function (type, amount) {
  selectedData.type = type;
  selectedData.amount = amount;
  if (amount) {
    if (amount > 0) {
      updatePaymentInfo();
    } else {
      resetCustom();
    }
  }

  checkConfirmButton();
};

var getSteps = function () {
  var steps = ["Intro", "SelectType"];

  if (selectedData.type == "gift") {
    steps = steps.concat(["Shipping", "Billing", "Preview"]);
  } else if (selectedData.type == "digital") {
    steps = ["Intro", "Billing", "Preview"]
  } else {
    steps = steps.concat(["PaymentInfo"]);
  }

  steps = steps.concat(["ThankYou"]);

  return steps;
};

var getPreviousStep = function () {
  var steps = getSteps();
  var index = steps.indexOf(currentStep);
  if (index == -1) {
    return steps[1];
  }
  return steps[index - 1];
};

var getNextStep = function () {
  var steps = getSteps();
  var index = steps.indexOf(currentStep);
  return steps[index + 1];
};

var buttons = $("#supporterSteps > *");
var monthlyButtons = $("#monthlyPledge > button");
var yearlyButtons = $("#yearlyPledge > button");
var giftsButtons = $(".select-gift");

var resetButtons = function () {
  [monthlyButtons, yearlyButtons, giftsButtons].forEach(function (buttons) {
    buttons.each(function (index, el) {
      $(el).removeClass("active");
    });
  });
};

var activeStep = function (step) {
  $(buttons[step]).addClass("active");
  $(buttons[currentStep]).removeClass("active");
};

var showPanel = function (step) {
  var $previous = $("#supporterStep" + currentStep);
  var $step = $("#supporterStep" + step);

  $previous.hide();
  $step.show();
  activeStep(step);
  currentStep = step;
  checkConfirmButton();
};

var $itemForm;

var checkConfirmButton = function () {
  var $confirmButton = $("#confirmButton");
  flowKind = $("#supporterSteps").data("flow");
  if (currentStep === "SelectType") {
    if (
      (selectedData.type === "month" && selectedData.amount >= 10) ||
      (selectedData.type === "year" && selectedData.amount >= 100) ||
      selectedData.type === "one-time" ||
      selectedData.type === "gift" ||
      flowKind !== "become_supporter"
    ) {
      $confirmButton.prop("disabled", false);
    } else {
      $confirmButton.prop("disabled", true);
    }
  } else if (currentStep === 0) {
    $confirmButton.prop("disabled", false);
  } else {
    $confirmButton.prop("disabled", false);
  }

  if (currentStep === "PaymentInfo" && selectedData.type != "gift") {
    var method = $("#payment-method").val();
    if (method == "credit-card") {
      var confirm = checkCreditCardForm();
      $confirmButton.prop("disabled", !confirm);
    } else {
      $confirmButton.prop("disabled", false);
    }
    $confirmButton.text("Confirm Payment");
  } else {
    $confirmButton.text("Continue");
  }

  if (currentStep === "Intro") {
    $("#backButton").hide();
  } else {
    $("#backButton").show();
  }
};

var updatePaymentInfo = function () {
  var pledgeType = selectedData.type;
  var pledgeAmount = selectedData.amount;
  if (pledgeType === "year") {
    $("#pledge-type").html(
      'You’ve  selected  to  make  a  one  time  donation  of <span class="accent-color">$' +
      pledgeAmount +
      "</span> ."
    );
    $("#payment-type").html(
      "Your  card  will  be  charged  in  this  amount."
    );
    $("#select-payment-row").show();
  } else if (pledgeType === "month") {
    $("#pledge-type").html(
      'You’ve  selected  to  pledge <span class="accent-color">$' +
      pledgeAmount +
      ".00 per month</span> . "
    );
    $("#payment-type").html(
      "Your  card  will  be  billed  monthly  until  you  choose  to  cancel."
    );
    // Do not show select payment section.
    $("#select-payment-row").show();
    $(".payment-method-toggle")
      .last()
      .hide();
  } else {
    $("#pledge-type").html(
      'You’ve  selected  to  make  a  one  time  donation  of <span class="accent-color">$' +
      pledgeAmount +
      "</span> ."
    );
    $("#payment-type").html(
      "Your  card  will  be  charged  in  this  amount."
    );
    $("#select-payment-row").show();
  }
  $("#hiddenAmountInput").val(pledgeAmount);
  $("#hiddenTypeInput").val(pledgeType);
};

var resetCustom = function () {
  yearlyCustom = $("#yearlyCustom");
  monthlyCustom = $("#monthlyCustom");
  $(yearlyCustom).val("");
  $(yearlyCustom).removeClass("active");
  $(monthlyCustom).val("");
  $(monthlyCustom).removeClass("active");
  $("#yearly-less").text("");
  $("#monthly-less").text("");
  $("#yearlyCustomConfirm").hide();
  $("#monthlyCustomConfirm").hide();
};

$(document).ready(function () {
  if (typeof window.completeSubpage === "undefined") {
    window.completeSubpage = "";
  }
  currentStep = "Intro";

  $(document).on("change", ".gift-content select", function () {
    /* Add a border to the display selection on dropdown change.
     */
    var $that = $(this);
    var val = $that.val();
    var $confirmSelectionButton = $("#confirmSelectionButton");
    $confirmSelectionButton.prop("disabled", val == "none");

    if (val == "none") {
      setSelected("", 0);
      $itemForm = null;
    }
  });

  $(document).on("submit", ".add-to-basket", function (e) {
    e.preventDefault();

    function checkout() {
      // TODO: fix hardcoded URL
      $.get("/store/checkout/", function (data) {
        $.get(data.url, function (data) {
          if (data.url && data.url.indexOf('payment-method') > -1) {
            $.get(data.url, function (data) {
              $.get(data.url, function (data) {
                $("#supporterStepBilling").html(data);
                showPanel("Billing");
                replaceWhiteSelects($("#supporterStepBilling")[0]);
                renderCardAnimation("#payment-form");
              });
            });
          } else {
            $("#supporterStepShipping").html(data);
            showPanel("Shipping");
            replaceWhiteSelects($("#supporterStepShipping")[0]);
          }
        });
      });
    }

    $.ajax({
      url: $(this).attr("action"),
      type: $(this).attr("method"),
      data: $(this).serialize(),
      success: function (data) {
        checkout();
      },
      error: function (xhr, err) {
        console.log(err);
      }
    });

    return false;
  });

  $(document).on("click", ".select-supporter-type-toggle", function (event) {
    // toggle payment method buttons and forms visibility. Set input value.

    event.preventDefault();
    if ($(this).hasClass("active")) {
      return false;
    }
    $(this).addClass("active");
    $(".select-supporter-type-toggle")
      .not(this)
      .removeClass("active");
    var supporterType = $(this).data("id");
    var selector = "#" + supporterType + "-input.supporter-plan-input";

    $(selector).removeClass("hidden");
    $(".supporter-plan-input")
      .not(selector)
      .addClass("hidden");

    return false;
  });

  $(document).on("submit", "#new_shipping_address", function () {
    $.ajax({
      url: $(this).attr("action"),
      type: $(this).attr("method"),
      data: $(this).serialize(),
      success: function (data) {
        if (data.url) {
          $.get(data.url, function (data) {
            $.get(data.url, function (data) {
              $.get(data.url, function (data) {
                $("#supporterStepBilling").html(data);
                showPanel("Billing");
                replaceWhiteSelects($("#supporterStepBilling")[0]);
                renderCardAnimation("#payment-form");
              });
            });
          });
        } else {
          $("#supporterStepShipping").html(data);
          $("#confirmButton").prop("disabled", false);
          replaceWhiteSelects($("#supporterStepShipping")[0]);
        }
      },
      error: function (xhr, err) {
        console.log(err);
      }
    });

    return false;
  });

  $(document).on("submit", "#payment-form", function () {
    $.ajax({
      url: $(this).attr("action"),
      type: $(this).attr("method"),
      data: $(this).serialize(),
      success: function (data) {
        $("#supporterStepPreview").html(data);
        showPanel("Preview");
        $("#confirmButton").text("Confirm");
      },
      error: function (xhr, err) {
        console.log(err);
      }
    });

    return false;
  });

  $(document).on("click", ".billing-address-toggle", function (event) {
    event.preventDefault();
    if ($(this).hasClass("active")) {
      return false;
    }
    $(this).addClass("active");
    $(".billing-address-toggle")
      .not(this)
      .removeClass("active");
    var $address = $("#custom-billing-address");
    $address.toggleClass("hidden");

    return false;
  });

  $(document).on("click", ".payment-method-toggle", function (event) {
    // toggle payment method buttons and forms visibility. Set input value.

    event.preventDefault();
    if ($(this).hasClass("active")) {
      return false;
    }
    $(this).addClass("active");
    $(".payment-method-toggle")
      .not(this)
      .removeClass("active");
    var paymentMethod = $(this).data("id");
    var selector = "#" + paymentMethod + "-form.payment-method-form";

    $(selector).removeClass("hidden");
    $(".payment-method-form")
      .not(selector)
      .addClass("hidden");

    // Set new value to input - payment-method
    $("#payment-method").val(paymentMethod);
    checkConfirmButton();

    return false;
  });

  $(document).on("submit", "#place-order", function () {
    var flow_type = $("#supporterSteps").data("flow");
    $(this).append(
      $('<input type="hidden" name="flow_type" />').val(flow_type)
    );
    $.ajax({
      url: $(this).attr("action"),
      type: $(this).attr("method"),
      data: $(this).serialize(),
      success: function (data) {
        if (data && data.payment_url) {
          window.location = data.payment_url;
        } else if (data && data.success_url) {
          window.location = data.success_url;
        } else if (data && data.error) {
          // go back to previous step
          $("#backButton").click();
        } else {
          submitComplete();
        }
      },
      error: function (xhr, err) {
        console.log(err);
      }
    });

    return false;
  });

  function submitComplete() {
    var $supporterForm = $("#formSupporter");
    $.ajax({
      type: "POST",
      url: $supporterForm.attr("action"),
      data: $supporterForm.serialize(),
      success: function (data) {
        if (typeof completeSubpage !== "undefined") {
          notCompleteContainer.html("");
          var flowCompleteSubpage = window.subpages.get(completeSubpage);
          flowCompleteSubpage.load();
        } else {
          window.location = data.location;
        }
      },
      error: function () {}
    });
  }

  $(document).on("change", 'input[name="payment_method"]', function (event) {
    event.stopPropagation();
    event.preventDefault();
    var $that = $(this);
    var option = $that.attr("id");
    if (option == "pay-credit-card") {
      $("#credit-card-form").show();
      $("#paypal-form").hide();
    } else if (option == "pay-paypal") {
      $("#credit-card-form").hide();
      $("#paypal-form").show();
    }
  });

  $(document).on("click", "#monthlyPledge > button", function () {
    $("#monthlyPledge > button").removeClass("active");
    $(this).addClass("active");
    $("#confirmSelectionButton").prop("disabled", false);
    var amount = $(this).val();
    resetButtons();
    resetCustom();
    $(this).addClass("active");
    setSelected("month", amount);
    var $selectionConfirmationDialog = $("#selectionConfirmationDialog");
    $selectionConfirmationDialog.find(".title").text("become a supporter");
    $selectionConfirmationDialog.find(".subtitle").text("Monthly pledge");
    $selectionConfirmationDialog
      .find(".text")
      .html(
        "You have selected a monthly pledge of $" +
        amount +
        ". Monthly pledges are 100% tax deductible and are billed automatically. Monthly pledges may be cancelled at any time from your Account Settings. You will receive access to The SmallsLIVE Archive for as long as you are a Supporting Member of The SmallsLIVE Foundation."
      );
    $selectionConfirmationDialog.find(".gift-content");
    $selectionConfirmationDialog.modal("show");
  });

  $(document).on("click", "#yearlyPledge > button", function () {
    $("#yearlyPledge > button").removeClass("active");
    $(this).addClass("active");
    $("#confirmSelectionButton").prop("disabled", false);
    var amount = $(this).val();
    resetButtons();
    resetCustom();
    setSelected("year", amount);
    var $selectionConfirmationDialog = $("#selectionConfirmationDialog");
    $selectionConfirmationDialog.modal("show");
    $selectionConfirmationDialog.find(".title").text("become a supporter");
    $selectionConfirmationDialog.find(".subtitle").text("One time donation");
    $selectionConfirmationDialog
      .find(".text")
      .html(
        "You have selected a One Time Donation of $" +
        amount +
        ". One Time Donations are 100% tax deductible. All tax documents are available from your Account Settings. You will receive access to The SmallsLIVE Archive for the remainder of the tax year."
      );
    $selectionConfirmationDialog.find(".gift-content");
  });

  $(document).on("mousedown", ".confirm-custom", function () {
    $type = $(this).data("type");
    $value = $(this).data("value");
    console.log($type, $value);
    setSelected($type, $value);
    resetButtons();
    resetCustom();
    if ($type == "month") {
      var $selectionConfirmationDialog = $("#selectionConfirmationDialog");
      $selectionConfirmationDialog.modal("show");
      $selectionConfirmationDialog.find(".title").text("become a supporter");
      $selectionConfirmationDialog.find(".subtitle").text("Monthly pledge");
      $selectionConfirmationDialog
        .find(".text")
        .html(
          "Thank you for choosing to help jazz music and musicians all over the world. You have selected a monthly pledge of $" +
          $value +
          ". Monthly pledges are 100% tax deductible and are billed automatically. Monthly pledges may be cancelled at any time from your Account Settings. You will receive access to The SmallsLIVE Archive for as long as you are a Supporting Member of The SmallsLIVE Foundation."
        );
      $selectionConfirmationDialog.find(".gift-content");
    } else {
      var $selectionConfirmationDialog = $("#selectionConfirmationDialog");
      $selectionConfirmationDialog.modal("show");
      $selectionConfirmationDialog.find(".title").text("become a supporter");
      $selectionConfirmationDialog.find(".subtitle").text("One time donation");
      $selectionConfirmationDialog
        .find(".text")
        .html(
          "Thank you for choosing to help jazz music and musicians all over the world. You have selected a One Time Donation of $" +
          $value +
          ". One Time Donations are 100% tax deductible. All tax documents are available from your Account Settings. You will receive access to The SmallsLIVE Archive for the remainder of the tax year."
        );
      $selectionConfirmationDialog.find(".gift-content");
    }
  });

  var oneTimePayment = $("#oneTimePayment").find("input")[0];
  var monthlyCustom = $("#monthlyCustom");
  var yearlyCustom = $("#yearlyCustom");

  $(document).on("focusout", ".custom-out", function () {
    resetCustom();
  });

  function isPositiveInteger(s) {
    return /^\+?[1-9][\d]*$/.test(s);
  }

  $(oneTimePayment).on("keyup", function (event) {
    var value = $(oneTimePayment).val();
    if (value && isPositiveInteger(value)) {
      resetButtons();
      setSelected("one-time", value);
      $(oneTimePayment).addClass("active");
      if (event.keyCode == 13) {
        $("#confirmButton").click();
      }
    }
  });

  $(document).on("keyup", "#monthlyCustom", function (event) {
    monthlyCustom = $("#monthlyCustom");
    yearlyCustom = $("#yearlyCustom");
    var value = $(monthlyCustom).val();
    if (value > 9) {
      $("#monthlyCustomConfirm").data("value", value);
      $("#monthlyCustomConfirm").show();
    } else {
      $("#monthlyCustomConfirm").data("value", "");
      $("#monthlyCustomConfirm").hide();
    }
    if (value && isPositiveInteger(value)) {
      resetButtons();
      $(yearlyCustom).val("");
      setSelected("month", value);
      $(monthlyCustom).addClass("active");
      $(yearlyCustom).removeClass("active");
      if (event.keyCode == 13) {
        var amount = $(this).val();
        if (amount > 9) {
          resetButtons();
          resetCustom();
          setSelected("year", amount);
          var $selectionConfirmationDialog = $("#selectionConfirmationDialog");
          $selectionConfirmationDialog.modal("show");
          $selectionConfirmationDialog
            .find(".title")
            .text("become a supporter");
          $selectionConfirmationDialog.find(".subtitle").text("Monthly pledge");
          $selectionConfirmationDialog
            .find(".text")
            .html(
              "You have selected a monthly pledge of $" +
              amount +
              ". Monthly pledges are 100% tax deductible and are billed automatically. Monthly pledges may be cancelled at any time from your Account Settings. You will receive access to The SmallsLIVE Archive for as long as you are a Supporting Member of The SmallsLIVE Foundation."
            );
          $selectionConfirmationDialog.find(".gift-content");
        } else {
          $("#monthly-less").text("The minimun monthly pledge is $10 dolars");
        }
      }
    } else {
      setSelected("", 0);
      $(monthlyCustom).removeClass("active");
    }
  });

  $(document).on("keyup", "#yearlyCustom", function (event) {
    monthlyCustom = $("#monthlyCustom");
    yearlyCustom = $("#yearlyCustom");
    var value = $(yearlyCustom).val();
    flowKind = $("#supporterSteps").data("flow");
    freeDonate = $("#supporterSteps").data("free-donate");
    if (value && isPositiveInteger(value)) {
      resetButtons();
      $(monthlyCustom).val("");
      setSelected("year", value);
      $(yearlyCustom).addClass("active");
      $(monthlyCustom).removeClass("active");
      if (
        value > 99 ||
        (flowKind !== "become_supporter" && freeDonate !== "False")
      ) {
        $("#yearlyCustomConfirm").data("value", value);
        $("#yearlyCustomConfirm").show();
      } else {
        $("#yearlyCustomConfirm").data("value", "");
        $("#yearlyCustomConfirm").hide();
      }
      if (event.keyCode == 13) {
        var amount = $(this).val();
        if (
          amount > 99 ||
          (flowKind !== "become_supporter" && freeDonate !== "False")
        ) {
          resetButtons();
          resetCustom();
          setSelected("year", amount);
          var $selectionConfirmationDialog = $("#selectionConfirmationDialog");
          $selectionConfirmationDialog.modal("show");
          $selectionConfirmationDialog
            .find(".title")
            .text("become a supporter");
          $selectionConfirmationDialog
            .find(".subtitle")
            .text("One time donation");
          $selectionConfirmationDialog
            .find(".text")
            .html(
              "You have selected a One Time Donation of $" +
              amount +
              ". One Time Donations are 100% tax deductible. All tax documents are available from your Account Settings. You will receive access to The SmallsLIVE Archive for the remainder of the tax year."
            );
          $selectionConfirmationDialog.find(".gift-content");
        } else {
          $("#yearly-less").text("The minimun donation is $100 dolars");
        }
      }
    } else {
      $(yearlyCustom).removeClass("active");
      setSelected("", 0);
    }
  });

  // var submitForm = function () {
  //   sentHint.show();
  //   $supporterForm.trigger('submit');
  // };

  $(document).on("click", ".select-gift", function () {
    // fade other items and make this one active
    $(".select-gift").removeClass("active");
    $(this).addClass("active");
    $(".store-list-item .overlay").fadeIn();
    var $parent = $(this).parent();
    $parent.find(".overlay").fadeOut();
    // highlight dropdown if no option selected
    var $option = $parent.find(".same-as-selected");
    var $select = $parent.find(".select-selected");
    $(".select-selected").removeClass("alert");
    if ($option.length == 0 || $option.val() === "none") {
      $select.addClass("alert");
      $("#confirmButton").prop("disabled", true);
    } else {
      $select.removeClass("alert");
      $("#confirmButton").prop("disabled", false);
    }
    $itemForm = $(this)
      .parent()
      .parent()
      .parent()
      .find("form");
    var $item = $(this)
      .parent()
      .parent()
      .find(".modal-content")
      .clone();
    var $selectionConfirmationDialog = $("#selectionConfirmationDialog");
    $selectionConfirmationDialog.find(".title").text($(this).text());
    var giftTier = $(this).attr("data-type");
    var hasVariants = $(this).data("variants") && $(this).data("variants") != "0";
    $selectionConfirmationDialog
      .find(".subtitle")
      .text("Gift Tier: " + giftTier);
    let price = $(this)
      .children(".price-tag")
      .text();
    let cost = $(this).attr("data-cost");

    var tax = 0;
    var priceInt = parseInt(price.substring(1).replace(/,/g, ""))

    if (cost && typeof cost != "undefined") {
      tax = priceInt - parseInt(cost);
    } else {
      tax = priceInt;
    }
    var content = 'You have selected a one time donation of <span class="smalls-color">' +
      price +
      '</span>  of which <span class="smalls-color">$' +
      tax +
      "</span> is tax deductible. You will receive access to The SmallsLIVE Archive for the remainder of the tax year. You have also chosen to receive a " +
      giftTier +
      " as a gift for your contribution.";
    if (hasVariants) {
      content = content + '<br> Please select an option below.'
    }
    $selectionConfirmationDialog
      .find(".text")
      .html(content);

    var $giftContent = $selectionConfirmationDialog.find(".gift-content");
    $giftContent.html($item);
    $item.removeClass("hidden");
    $selectionConfirmationDialog
      .find(".select")
      .addClass("white-border-select");
    replaceWhiteSelects($giftContent[0]);
    var $select = $selectionConfirmationDialog.find(".select-items");
    var $confirmSelectionButton = $("#confirmSelectionButton");
    $confirmSelectionButton.prop("disabled", $select.length == 1);
    $selectionConfirmationDialog.modal("show");
  });

  function giftSelected(selection) {
    if ($itemForm) {
      var $input = $itemForm.find('input[name="child_id"]');
      $input.val(selection);
      setSelected("gift", 0);
    }
    $("#confirmButton").prop("disabled", false);
    $("#confirmButton").click();
  }

  var $selectionConfirmationDialog = $("#selectionConfirmationDialog");
  var $selectionConfirmationCloseButton = $selectionConfirmationDialog.find(
    ".close-button"
  );

  $(document).on("click", "#confirmSelectionButton", function () {
    $("#confirmButton").show();
    $("#selectionConfirmationDialog").modal("hide");
    var $variantSelect = $selectionConfirmationDialog.find("select");

    if ($variantSelect.length != 0) {
      giftSelected($variantSelect.val());
    } else {
      giftSelected($("#single-product").val());
    }
  });

  $(document).on("click", "#cancelSelectionButton", function () {
    resetButtons();
    $("#selectionConfirmationDialog").modal("hide");
  });
  $(".close-action").click(function () {
    $selectionConfirmationDialog.modal("hide");
    resetButtons();
  });
  $selectionConfirmationDialog.on("hidden.bs.modal", function () {
    resetButtons();
    $selectionConfirmationDialog.find(".title").empty();
    $selectionConfirmationDialog.find(".subtitle").empty();
    $selectionConfirmationDialog.find(".text").empty();
    $selectionConfirmationDialog.find(".gift-content").empty();
  });

  var checks = {
    "#card-number": 19, //4444 4444 4444 4444
    "#expiry-year": 2,
    "#cvc": 3,
    "#expiry-month": 2
  };
  var checksFlow = {
    "#card-number": 19, //4444 4444 4444 4444
    "#expiry-month": 2,
    "#expiry-year": 2,
    "#cvc": 3
  };

  $(document).on("keyup", "#payment-form input", function (e) {
    flowKind = $("#supporterSteps").data("flow");
    checkConfirmButton();

    if (e.which > 90 || e.which < 48) {
      return;
    }

    var id = "#" + $(this).attr("id");
    var keys = Object.keys(checksFlow);
    var pos = keys.indexOf(id);
    if (pos + 1 < keys.length && $(this).val().length == checksFlow[id]) {
      if (id == "#expiry-year") {
        $("#name-on-card").focus();
      } else {
        $(keys[pos + 1]).focus();
      }
    }
  });

  function checkInput(selector, value) {
    $input = $(selector);
    return $input.val().length === value;
  }

  function checkCreditCardForm() {
    var check = true;
    $.each(checks, function (selector, value) {
      if (!checkInput(selector, value)) {
        if (selector == "#expiry-month") {
          if (parseInt($input.val()) < 13 && $input.val().trim() != "") {
            return;
          }
        }
        console.log("No " + selector);
        check = false;
        return;
      }
    });

    if (!check) {
      return false;
    }

    if ($("#name-on-card").val().length === 0) {
      return false;
    }

    return true;
  }

  $(".supporter-card-data .form-control").on("keyup", function () {
    $(this).removeClass("error");

    if ($(".supporter-card-data .form-control.error").length == 0) {
      $("#form-general-error").text("");
    }
  });

  function getPaymentInfoForm() {
    var $step = $("#supporterStepPaymentInfo");
    var url = $step.data("payment-info-url");

    $.ajax({
      url: url,
      type: "get",
      success: function (data) {
        $step.html(data);
        updatePaymentInfo();
        replaceWhiteSelects($("#supporterStepPaymentInfo")[0]);
        renderCardAnimation("#payment-form");
        renderPayPal(paypal, selectedData.amount);
        showPanel(getNextStep());
      },
      error: function (xhr, err) {
        console.log(err);
      }
    });
  }

  function buttonsSizeOrder() {
    if (document.body.clientWidth > 768) {
      var upperButtonWidth = 0;
      $(".select-gift").each(function (index) {
        if (index > 0) {
          $(this).css("width", upperButtonWidth);
        }
        upperButtonWidth = $(this).css("width");
        upperButtonWidth = upperButtonWidth.substring(
          0,
          upperButtonWidth.length - 2
        );
        upperButtonWidth = parseInt(upperButtonWidth) + 100;
        upperButtonWidth = upperButtonWidth + "px";
      });
    }
  }

  buttonsSizeOrder();

  $(document).on("click", "#confirmButton", function (event) {
    console.log(currentStep);
    var $that = $(this);
    $that.prop("disabled", true);

    if (selectedData.type == "gift" || selectedData.type  == "digital") {
      event.preventDefault();
      event.stopPropagation();
    }

    if (currentStep == "Intro") {
      $(this).hide();
    }

    if (currentStep === "PaymentInfo") {
      var method = $("#payment-method").val();
      if (method == "credit-card") {
        var $inputs = $(".supporter-card-data .form-control");
        var errors = false;
        $inputs.each(function () {
          if (!$(this).val()) {
            $(this).addClass("error");
            errors = true;
          }
        });
        $("#sentHint").show();
        if (errors) {
          $("#sentHint").hide();
          $("#form-general-error").text("Please correct errors above");
        } else {
          startStripePayment(
            $("#payment-form"),
            $("#supporterStepPaymentInfo").data("payment-info-complete-url"),
            completeSubpage
          );
        }
      } else if (method == "paypal") {
        startPayPalPayment(
          $("#payment-form"),
          $("#supporterStepPaymentInfo").data("payment-info-complete-url"),
          completeSubpage
        );
      } else if (method == "existing-credit-card") {
        startStripePayment(
          $("#payment-form"),
          $("#supporterStepPaymentInfo").data("payment-info-complete-url"),
          completeSubpage
        );
      }
    } else if (currentStep === "SelectType" && selectedData.type == "gift") {
      $(".step-button").removeClass("hidden");
      $itemForm.submit();
    } else if (currentStep === "Shipping" && selectedData.type == "gift") {
      $("#new_shipping_address").submit();
    } else if (currentStep === "Billing" && (selectedData.type == "gift" || selectedData.type  == "digital")) {
      $("#payment-form").submit();
    } else if (currentStep === "Preview" && (selectedData.type == "gift" || selectedData.type  == "digital")) {
      $("#place-order").submit();
    } else if (currentStep === "SelectType" && selectedData.type != "gift") {
      getPaymentInfoForm();
    } else {
      $(".step-button.gift").addClass("hidden");
      showPanel(getNextStep());
    }

    var $currentButton = $(".step-button.active");
    $currentButton.removeClass("active");
    $currentButton.next().addClass("active");
  });

  $(document).on("click", "#backButton", function () {
    if (currentStep == "PaymentInfo") {
      $("#confirmButton").hide();
    }

    if (currentStep == "SelectType") {
      $("#confirmButton").show();
    }
    if (currentStep == "Shipping") {
      $("#confirmButton").hide();
    }

    if (currentStep == "SelectType") {
      $("#confirmButton").show();
    }
    if (currentStep === "Intro") return;
    $("#confirmButton").text("Confirm");

    setSelected("", 0);
    showPanel(getPreviousStep());
    $itemForm = null;
    var $currentButton = $(".step-button.active");
    $currentButton.removeClass("active");
    $currentButton.prev().addClass("active");
  });

  checkConfirmButton();
});