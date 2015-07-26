$(function(){
    var $select = $("#brushSize");
    for (i = 1; i <= 10; i++){
        $select.append($('<option></option>').val(i).html(i))
    }
});