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