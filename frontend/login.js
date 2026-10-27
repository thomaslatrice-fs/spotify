async function checkLogin() {
  const message = document.getElementById("loginMessage");

  try {
    const response = await fetch("/api/auth/status", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Unable to check login");
    }

    const data = await response.json();

    if (data.authenticated === true) {
      window.location.replace("/");
    }
  } catch (error) {
    message.textContent =
      "Unable to check your session. You can try logging in again.";
  }
}

checkLogin();
