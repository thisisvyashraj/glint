/* Page transitions, animated FAQ accordions and the contact form. The destination email lives only on the server. */
(function(){
var pt=document.body&&document.body.hasAttribute("data-pt");
if(pt){document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[href]");if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.button||a.target==="_blank"||a.hasAttribute("download"))return;var u=new URL(a.href,location.href);if(u.origin!==location.origin||(u.pathname===location.pathname&&u.search===location.search))return;e.preventDefault();document.body.classList.add("pt-out");setTimeout(function(){location.href=u.href},230)});
addEventListener("pageshow",function(){document.body.classList.remove("pt-out")})}
function tog(d){var s=d.querySelector("summary");if(d._a)d._a.cancel();var from=d.offsetHeight,opening=!d.open,to;
if(opening){d.open=true;d.style.height="auto";to=d.offsetHeight}else{d.classList.add("closing");to=s.offsetHeight+(d.offsetHeight-d.clientHeight)}
d.style.overflow="hidden";var a=d._a=d.animate({height:[from+"px",to+"px"]},{duration:520,easing:"cubic-bezier(.22,.9,.24,1)"});
a.onfinish=function(){if(!opening)d.open=false;d.classList.remove("closing");d.style.height=d.style.overflow="";d._a=null};a.oncancel=function(){d.style.height=d.style.overflow=""}}
document.addEventListener("click",function(e){var s=e.target.closest&&e.target.closest("summary");if(!s)return;var d=s.parentElement;if(!d||d.tagName!=="DETAILS"||!d.closest(".gx-help,#faq,.faq"))return;
e.preventDefault();if(matchMedia("(prefers-reduced-motion:reduce)").matches){d.open=!d.open;return}
if(!d.open&&d.closest("#faq"))[].forEach.call(d.parentElement.querySelectorAll("details[open]:not(.closing)"),function(o){if(o!==d)tog(o)});tog(d)});
document.addEventListener("pointermove",function(e){var d=e.target.closest&&e.target.closest("#faq details");if(d){var r=d.getBoundingClientRect();d.style.setProperty("--mx",e.clientX-r.left+"px");d.style.setProperty("--my",e.clientY-r.top+"px")}},{passive:true});
var mb=document.getElementById("mb"),mm=document.getElementById("mm");
if(mb&&mm){var set=function(o){mb.setAttribute("aria-expanded",o);mm.classList.toggle("on",o);document.documentElement.style.overflow=o?"hidden":""};mb.onclick=function(){set(mb.getAttribute("aria-expanded")!=="true")};mm.onclick=function(e){if(e.target.closest("a"))set(false)};addEventListener("keydown",function(e){if(e.key==="Escape")set(false)})}
var f=document.getElementById("cf");
if(f)f.addEventListener("submit",function(e){e.preventDefault();var s=document.getElementById("cs"),b=f.querySelector("button"),d=Object.fromEntries(new FormData(f));
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email||"")||(d.message||"").trim().length<5){s.textContent="Please enter a valid email and a message.";return}
b.disabled=true;s.textContent="Sending...";
fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)}).then(function(r){return r.json().catch(function(){return{}}).then(function(x){if(r.ok){s.textContent="Thanks! Your message was sent.";f.reset()}else s.textContent=x.error||"Could not send. Please try again."})}).catch(function(){s.textContent="You seem to be offline. Please try again."}).then(function(){b.disabled=false})});
})();
