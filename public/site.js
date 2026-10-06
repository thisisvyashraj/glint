/* Edit this one line to change the contact address on every page. */
var GLINT_EMAIL="support@your-domain.com";
document.querySelectorAll("[data-email]").forEach(function(a){a.textContent=GLINT_EMAIL;a.href="mailto:"+GLINT_EMAIL});
var f=document.getElementById("cf");
if(f)f.addEventListener("submit",function(e){e.preventDefault();var d=new FormData(f),s=encodeURIComponent("[Glint] "+d.get("topic")+": "+(d.get("name")||"")),b=encodeURIComponent((d.get("message")||"")+"\n\nFrom: "+(d.get("name")||"")+" <"+(d.get("email")||"")+">");location.href="mailto:"+GLINT_EMAIL+"?subject="+s+"&body="+b;document.getElementById("cs").textContent="Opening your email app. If nothing opens, write to "+GLINT_EMAIL+"."});
