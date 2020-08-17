// Below function Executes on click of login button.
function validate(){
var username = document.getElementById("email").value;
var password = document.getElementById("password").value;
if ( username == "user" && password == "qwerty"){
alert ("Login successful");
window.location = "success.html"; // Redirecting to other page.
return true;
}
else{
alert("Wrong credentials, Please try again.");

}
}

function create(){
	var Name = document.getElementById("Name").value;
	var newEmail = document.getElementById("email").value;
	var newPassword = document.getElementById("password").value;
	alert("Successfully created account! Please Login to enjoy our Services");
	window.location = "login.html";
	return true;
}