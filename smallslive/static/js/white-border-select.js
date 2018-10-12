function replaceWhiteSelects(divElement){
    divElement = divElement || document;
    var x, i, j, selElmnt, a, b, c, option;
    /*look for any elements with the class "white-border-select":*/
    x = divElement.getElementsByClassName("white-border-select");
    for (i = 0; i < x.length; i++) {
        var currentSelect = x[i];
        selElmnt = currentSelect.getElementsByTagName("select")[0];
      /*for each element, create a new DIV that will act as the selected item:*/
      a = document.createElement("DIV");
      a.setAttribute("class", "select-selected");
      a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
      currentSelect.appendChild(a);
      /*for each element, create a new DIV that will contain the option list:*/
      b = document.createElement("DIV");
      b.setAttribute("class", "select-items select-hide");
      for (j = 0; j < selElmnt.length; j++) {
          /*for each option in the original select element,
          create a new DIV that will act as an option item:*/
          c = document.createElement("DIV");
          option = selElmnt.options[j];
          c.innerHTML = option.innerHTML;
          if (option.getAttribute('noSelect') === "1") {
              continue;
          }
    
          c.setAttribute('value', option.getAttribute('value'));
    
          if ($(currentSelect).hasClass('white-border-multiline')) {
              c.innerHTML = '';
              var lines = option.innerHTML.split('#');
              lines.forEach(function (text) {
                  var linediv = document.createElement('span');
                  linediv.innerHTML = text;
                  c.appendChild(linediv);
              });
          }
    
          c.addEventListener("click", function (e) {
              /*when an item is clicked, update the original select box,
              and the selected item:*/
              var y, i, k, s, h;
              s = this.parentNode.parentNode.getElementsByTagName("select")[0];
              h = this.parentNode.previousSibling;
              for (i = 0; i < s.length; i++) {
                  var value = this.getAttribute('value');
                  if (s.options[i].value === value) {
                      s.selectedIndex = i;
                      $(s).trigger('change');
                      h.innerHTML = this.innerHTML;
                      y = this.parentNode.getElementsByClassName("same-as-selected");
                      for (k = 0; k < y.length; k++) {
                          y[k].removeAttribute("class");
                      }
                      this.setAttribute("class", "same-as-selected");
                      break;
                  }
              }
              h.click();
          });
          b.appendChild(c);
      }
      currentSelect.appendChild(b);
      a.addEventListener("click", function(e) {
          /*when the select box is clicked, close any other select boxes,
          and open/close the current select box:*/
          e.stopPropagation();
          closeAllSelect(this);
          this.nextSibling.classList.toggle("select-hide");
          this.classList.toggle("select-arrow-active");
      });
    }
    function closeAllSelect(elmnt) {
      /*a function that will close all select boxes in the document,
      except the current select box:*/
      var x, y, i, arrNo = [];
      x = divElement.getElementsByClassName("select-items");
      y = divElement.getElementsByClassName("select-selected");
      for (i = 0; i < y.length; i++) {
        if (elmnt == y[i]) {
          arrNo.push(i)
        } else {
          y[i].classList.remove("select-arrow-active");
        }
      }
      for (i = 0; i < x.length; i++) {
        if (arrNo.indexOf(i)) {
          x[i].classList.add("select-hide");
        }
      }
    }
    /*if the user clicks anywhere outside the select box,
    then close all select boxes:*/
    divElement.addEventListener("click", closeAllSelect);
    

}
replaceWhiteSelects();