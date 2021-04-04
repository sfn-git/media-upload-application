function changePassword(){

    // Elements
    currentPasswordEl = document.getElementById("password");
    newPasswordEl = document.getElementById("new-password");
    confirmNewPasswordEl = document.getElementById("confirm-new-password");

    currentPassword = document.getElementById("password").value;
    newPassword = document.getElementById("new-password").value;
    confirmNewPassword = document.getElementById("confirm-new-password").value;

    if(newPassword != confirmNewPassword){
        window.alert("Passwords do not match.");
        newPasswordEl.style.borderColor = "red";
        confirmNewPasswordEl.style.borderColor = "red";
    }else{
        $.ajax({

            url: "/changepassword",
            method: "PATCH",
            data: {
                currentPassword, 
                newPassword, 
                confirmNewPassword},
            success: (result)=>{
                window.alert(result.message);
                if(result.status){
                    window.location.replace("/logout");
                }
            },
            error: (error)=>{
                console.log(error);
            }

        });
    }

}