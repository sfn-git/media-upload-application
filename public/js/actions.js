function deleteVideo(id){

    if(window.confirm("Are you sure you would like to delete this content?")){
        $.ajax({
            url: "/video",
            type: "DELETE",
            data: {id},
            success: (data)=>{
                window.alert(data);
                window.location.reload();
            },
            error: (err)=>{
                window.alert("Could not delete");
                window.location.reload();
            }
        });
    }

}

function deletePhoto(id){

    if(window.confirm("Are you sure you would like to delete this content?")){
        $.ajax({
            url: "/photo",
            method: "DELETE",
            data: {id},
            success: (data)=>{
                window.alert(data);
                window.location.reload();
            },
            error: (err)=>{
                window.alert("Could not delete");
                window.location.reload();
            }
        });
    }

}

function editName(unique){

    var input = document.getElementById(`input_${unique}`);
    var text = document.getElementById(`name_${unique}`);
    var editButton = document.getElementById(`edit_${unique}`);
    var actions = document.getElementById(`action_group_${unique}`);

    editButton.style.display = "none";
    text.style.display = "none";

    input.style.display = "inline-block";
    actions.style.display = "inline-block";


}

function cancelEditName(unique){
    var input = document.getElementById(`input_${unique}`);
    var text = document.getElementById(`name_${unique}`);
    var editButton = document.getElementById(`edit_${unique}`);
    var actions = document.getElementById(`action_group_${unique}`);

    input.value = text.innerText;

    editButton.style.display = "inline-block";
    text.style.display = "inline-block";

    input.style.display = "none";
    actions.style.display = "none";
}

function saveName(unique){

    var input = document.getElementById(`input_${unique}`);
    var text = document.getElementById(`name_${unique}`);
    var editButton = document.getElementById(`edit_${unique}`);
    var actions = document.getElementById(`action_group_${unique}`);

    if(window.confirm("Are you sure you would like to change the name of this content?")){

        var newName = input.value;
        input.readonly = true;
        actions.style.display = "none";

        $.ajax({
            url: "/edit",
            method: "PATCH",
            data: {name: newName, unique},
            success: (res)=>{
                if(res.status){
                    text.innerHTML = newName;
                    text.style.display = "block";
                    editButton.style.display = "inline-block";
                    input.readonly = false;
                    input.style.display = "none";
                }else{
                    window.alert(res.message);
                }
            },
            error: (err)=>{
                window.alert("Something went wrong :(");
                window.location.reload();
            }
        });

    }

}