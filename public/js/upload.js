var progressBar = document.getElementById("progress");
var fileInput = document.getElementById("fileInput");

function uploadFile(){
    console.log("Upload File!");
    progressBar.style.display = "block";
    progressBar.value = 0;

    var file = fileInput.files[0];
    var formData = new FormData();

    formData.append("file", file, file.name);

    $.ajax({
        url: "/upload",
        type: "POST",
        data: formData,
        processData: false,
        contentType: false,
        success: (data)=>{
            var url = data.URL;
            document.getElementById("upload-form").style.display = "none";
            document.getElementById("message").style.display = "block";
            document.getElementById("alert-text").innerHTML = `Your video is now available!`;
            document.getElementById("copy-link").value = url;
            document.getElementById("url-link").href = url;
        },
        xhr: ()=>{
            var xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (evt)=>{
                var percentCompleted = evt.loaded / evt.total;
                percentCompleted = parseInt(percentCompleted * 100);

                progressBar.value = percentCompleted;
            }, false);

            return xhr;

        },
        error: (err)=>{
            console.log(err);
            window.alert("Something went wrong :(. Check your file types or try again later");
        }
    });

}

async function copyLink(){
    var url = document.getElementById("copy-link").value;
    await navigator.clipboard.writeText(url);
    document.getElementById("copy-button").class= "btn btn-success";
}

async function openLink(){
    document.getElementById("url-link").click();
}