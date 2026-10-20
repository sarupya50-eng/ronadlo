const $ = (id) => document.getElementById(id);

window.auralis.getKey().then((k) => {
  if (k) $("key").value = k;
});

$("get").onclick = () => window.auralis.openLink("https://console.cloud.google.com/apis/credentials");

async function save(force) {
  $("save").disabled = true;
  $("msg").style.color = "#b3b3b3";
  $("msg").textContent = "Checking key…";
  const r = await window.auralis.saveKey($("key").value, force);
  $("save").disabled = false;
  if (!r.ok) {
    $("msg").style.color = "#ff6b6b";
    $("msg").textContent = r.message;
    $("force").style.display = r.canForce ? "inline" : "none";
  } else {
    $("msg").style.color = "#1ed760";
    $("msg").textContent = "Saved!";
  }
}

$("save").onclick = () => save(false);
$("force").onclick = () => save(true);
$("key").addEventListener("keydown", (e) => e.key === "Enter" && save(false));
