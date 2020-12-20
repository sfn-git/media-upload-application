function submitForm(){
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
    var name = document.getElementById("name").value;
    var warning = document.getElementById("warning");

    warning.innerHTML = "";
    var passed = true;

    if(username == ""){
        warning.style.display = "block";
        warning.innerHTML += "Enter a username!<br>";
        passed = false;
    }

    if(password == ""){
        warning.style.display = "block";
        warning.innerHTML += "Enter a password!<br>";
        passed = false;
    }else if(password.length < 8){
        warning.style.display = "block";
        warning.innerHTML += "Password must be more than 8 characters!<br>";
        passed = false;
    }

    if(passed){
        warning.style.display = "none";
        warning.innerHTML = "";
        $.ajax({
            url: "/create",
            method: "POST",
            data: {
                username,
                password,
                name
            },
            success: (res)=>{
                if(res.status){
                    window.alert("Account Created!");
                    window.location.replace("/");
                }else{
                    warning.style.display = "block";
                    warning.innerHTML += res.message;
                }
            },
            error: (err)=>{
                window.alert("Something went wrong :(");
            }
        });
    }
}