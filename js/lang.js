(function(){var L=["de"],p;try{p=localStorage.getItem("gm-lang")}catch(e){}
if(!p||L.indexOf(p)<0){var n=(navigator.languages||[navigator.language||"de"]);p="";for(var i=0;i<n.length&&!p;i++){var c=String(n[i]).slice(0,2).toLowerCase();if(L.indexOf(c)>=0)p=c;}if(!p)p="de";}
location.replace("/"+p+location.search+location.hash);})();