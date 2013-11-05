var a_ErrorArray = new Array();

var ErrorStorage = 
    {
        //ARRAY of ERRORS
        

        addError: function (errortext) {
            if (a_ErrorArray.indexOf(errortext) > -1) {
                return;
            }
            else {
                a_ErrorArray[a_ErrorArray.length] = errortext;
            }
        },

        hasError: function (errortext) {
            if (a_ErrorArray.indexOf(errortext) > -1) {
                return 1;
            }
            else {
                return 0;
            }
        },

        removeError: function (errortext) {
            var ind = a_ErrorArray.indexOf(errortext);
            if (ind > -1) {
                a_ErrorArray.splice(ind, 1);
            }
        }
    }

