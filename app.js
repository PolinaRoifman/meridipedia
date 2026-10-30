(function(){
  var pages=document.querySelectorAll('.page');
  if('scrollRestoration' in history)history.scrollRestoration='manual';
  function route(restore){
    var raw=(location.hash||'#home').slice(1).split('/');
    var h=raw[0],sub=raw[1];
    if(h==='random'){var list=[].filter.call(pages,function(p){return ['home','gone','search'].indexOf(p.id)<0;});var pick=list[Math.floor(Math.random()*list.length)];try{history.replaceState({y:0},'','#'+pick.id);}catch(err){location.hash=pick.id;}h=pick.id;sub=undefined;}
    var found=false;
    pages.forEach(function(p){var on=p.id===h; p.classList.toggle('active',on); if(on)found=true;});
    if(!found){document.getElementById('gone').classList.add('active');}
    if(h==='index')drawChart();
    if(h==='search'){var q=document.getElementById('sq');if(q&&restore!==true)q.focus();}
    var y=(restore===true&&history.state&&history.state.y)||0;
    window.scrollTo(0,y);
    if(sub){var t=document.getElementById('o-'+sub);if(t){t.scrollIntoView({block:'center'});t.classList.remove('flash');void t.offsetWidth;t.classList.add('flash');}}
  }
  document.addEventListener('click',function(e){
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey)return;
    var a=e.target.closest&&e.target.closest('a[href^="#"]');
    if(!a)return;
    var href=a.getAttribute('href');
    e.preventDefault();
    if(href===location.hash)return;
    try{history.replaceState({y:window.scrollY},'');history.pushState({y:0},'',href);}catch(err){location.hash=href;}
    route(false);
  });
  window.addEventListener('popstate',function(){route(true);});
  window.addEventListener('hashchange',function(){ if(!history.state)route(false); });

  // вкладки карты
  var btns=document.querySelectorAll('.tabbtn');
  btns.forEach(function(b){b.addEventListener('click',function(){
    btns.forEach(function(x){x.setAttribute('aria-selected',x===b?'true':'false');});
    document.querySelectorAll('.tabpanel').forEach(function(p){p.hidden=(p.id!==b.dataset.tab);});
  });});

  var series=[
    {n:'ФОБ',a:[6.6,6.6,6.7,6.7,6.8,6.8,6.9,6.9,7.0,7.0]},
    {n:'Амактай',a:[6.9,7.0,6.9,7.1,7.2,7.1,7.3,7.2,7.5,7.5]},
    {n:'СРГ',a:[5.5,4.6,5.8,4.4,5.3,4.1,5.2,4.5,5.4,4.7]},
    {n:'Долор',a:[4.5,4.7,4.8,5.0,5.2,5.4,5.5,5.7,5.9,6.1]},
    {n:'Эже-Рузе',a:[6.3,6.5,6.9,7.2,7.5,7.8,8.1,8.4,8.8,9.0]}];
  var cols=['#6b5a9c','#b5593a','#a07a2c','#2e8a69','#6e9a2c'];
  series.forEach(function(s,i){s.s=cols[i];});
  var years=[];for(var y=1957;y<=1966;y++)years.push(y);
  var drawn=false;
  function drawChart(){
    if(drawn)return;drawn=true;
    var svg=document.getElementById('chart'),W=640,H=300,L=40,R=24,T=14,Bm=30;
    var min=4,max=10;
    function X(i){return L+12+(W-L-R-24)*i/9;}
    function Y(v){return T+(H-T-Bm)*(1-(v-min)/(max-min));}
    var h='';
    [4,5,6,7,8,9,10].forEach(function(g){h+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(g)+'" y2="'+Y(g)+'" stroke="var(--rule)"/><text x="'+(L-6)+'" y="'+(Y(g)+4)+'" font-size="11" text-anchor="end" fill="var(--mute)">'+g+'</text>';});
    years.forEach(function(yr,i){h+='<text x="'+X(i)+'" y="'+(H-10)+'" font-size="11" text-anchor="middle" fill="var(--mute)">'+yr+'</text>';});
    series.forEach(function(s){
      var pts=s.a.map(function(v,i){return X(i).toFixed(1)+','+Y(v).toFixed(1);}).join(' ');
      h+='<polyline points="'+pts+'" fill="none" stroke="'+s.s+'" stroke-width="2.2" stroke-linejoin="round"/>';
      s.a.forEach(function(v,i){h+='<circle cx="'+X(i).toFixed(1)+'" cy="'+Y(v).toFixed(1)+'" r="3" fill="'+s.s+'"/>';});
    });
    svg.innerHTML=h;
    document.getElementById('legend').innerHTML=series.map(function(s){return '<span><i style="background:'+s.s+'"></i>'+s.n+'</span>';}).join('');
    var t='<tr><th>Год</th>'+series.map(function(s){return '<th>'+s.n+'</th>';}).join('')+'</tr>';
    years.forEach(function(yr,i){t+='<tr><td>'+yr+'</td>'+series.map(function(s){return '<td>'+s.a[i].toFixed(1).replace('.',',')+'</td>';}).join('')+'</tr>';});
    document.getElementById('datatable').innerHTML=t;
  }

  // анкета
  var qs=[
   'Я регулярно могу позволить себе две сигареты и пиво.',
   'Я доверяю людям, которые живут рядом со мной.',
   'Я просыпаюсь без будильника, и это не из-за тревоги.',
   'Мой доход позволяет мне планировать расходы на месяц вперёд.',
   'Раз в месяц я покупаю что-нибудь совершенно ненужное и не испытываю вины.',
   'Если бы мне предложили прожить завтрашний день ещё раз, я бы согласился.',
   'Я редко тревожусь о здоровье своём и своих близких.',
   'Я бы без колебаний порекомендовал(а) свою жизнь знакомому.'];
  var labs=['Совсем не согласен','Скорее не согласен','Скорее согласен','Полностью согласен'];
  var quiz=document.getElementById('quiz'),qh='';
  qs.forEach(function(q,i){
    qh+='<div class="q"><b>'+(i+1)+'.</b> '+q+'<div class="scale">';
    for(var k=0;k<4;k++)qh+='<label><input type="radio" name="q'+i+'" value="'+k+'"><span>'+labs[k]+'</span></label>';
    qh+='</div></div>';
  });
  qh+='<button class="btn" id="qbtn" type="button">Посчитать</button>';
  quiz.innerHTML=qh;
  document.getElementById('qbtn').addEventListener('click',function(){
    var sum=0,n=0;
    for(var i=0;i<8;i++){var c=quiz.querySelector('input[name=q'+i+']:checked');if(c){sum+=+c.value;n++;}}
    var r=document.getElementById('quizresult');r.style.display='block';
    if(n<8){r.textContent='Ответьте на все восемь утверждений ('+n+' из 8).';return;}
    var sc=Math.round(sum/24*100)/10,txt=sc.toFixed(1).replace('.',',');
    var vals=series.map(function(s){return s.a[9];}).sort(function(a,b){return a-b;});
    var med=vals[2].toFixed(1).replace('.',',');
    var near=series.slice().sort(function(a,b){return Math.abs(a.a[9]-sc)-Math.abs(b.a[9]-sc);})[0];
    r.innerHTML='Ваш индекс: <b>'+txt+'</b> из 10. Медиана по странам-членам за 1966 год: '+med+'. Ближе всего к вам: '+near.n+'.';
  });

  // заявление
  document.getElementById('v-btn').addEventListener('click',function(){
    var nm=document.getElementById('v-name').value.trim(),fr=document.getElementById('v-from').value,ag=document.getElementById('v-age').value.trim();
    var r=document.getElementById('v-res');r.style.display='block';
    if(!nm||!fr||!ag){r.textContent='Заполните все три поля.';return;}
    var no=String(Math.floor(Math.random()*900000)+100000);
    r.textContent='';var bb=document.createElement('b');bb.textContent=nm+', вам предоставлена виза на въезд!';r.appendChild(bb);r.appendChild(document.createTextNode(' Номер визы: '+no+'. Явитесь на пристань озера Тихого, вас перевезут на Остров приёма.'));
  });

  // выручка Ли ТК
  (function(){
    var svg=document.getElementById('litkchart');if(!svg)return;
    var y0=1924,y1=1966,v={1924:8,1925:9,1926:11,1927:15,1928:27,1929:41,1930:55,1931:69,1932:82,1933:93,1934:100,1935:86,1936:80,1937:78,1938:77,1939:76,1940:76,1941:75,1942:75,1943:76,1944:75,1945:76,1946:75,1947:76,1948:76,1949:77,1950:77,1951:79,1952:80,1953:80,1954:82,1955:83,1956:83,1957:84,1958:85,1959:85,1960:86,1961:87,1962:89,1963:90,1964:90,1965:92,1966:94};
    var W=640,H=300,L=40,R=16,T=14,Bm=30,max=110;
    function X(y){return L+(W-L-R)*(y-y0)/(y1-y0);}
    function Y(a){return T+(H-T-Bm)*(1-a/max);}
    var h='';
    [0,25,50,75,100].forEach(function(g){h+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(g)+'" y2="'+Y(g)+'" stroke="var(--rule)"/><text x="'+(L-6)+'" y="'+(Y(g)+4)+'" font-size="11" text-anchor="end" fill="var(--mute)">'+g+'</text>';});
    [1925,1935,1945,1955,1965].forEach(function(yr){h+='<text x="'+X(yr)+'" y="'+(H-10)+'" font-size="11" text-anchor="middle" fill="var(--mute)">'+yr+'</text>';});
    var pts=[];for(var y=y0;y<=y1;y++)pts.push(X(y).toFixed(1)+','+Y(v[y]).toFixed(1));
    h+='<polyline points="'+pts.join(' ')+'" fill="none" stroke="#6b5a9c" stroke-width="2.4" stroke-linejoin="round"/>';
    svg.innerHTML=h;
  })();

  route(false);

  // поиск по статьям
  (function(){
    var form=document.getElementById('sform'),inp=document.getElementById('sq'),out=document.getElementById('sres');
    if(!form)return;
    function esc(t){return t.replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});}
    function find(t,q){var i=-1;while((i=t.indexOf(q,i+1))>=0){var L=/[a-zа-я0-9]/;if((i===0||!L.test(t.charAt(i-1)))&&(q.length>4||i+q.length>=t.length||!L.test(t.charAt(i+q.length))))return i;}return -1;}
    var docs=[];
    pages.forEach(function(p){
      if(['search','gone'].indexOf(p.id)>=0)return;
      var h=p.querySelector('h1');
      var cl=p.cloneNode(true);cl.querySelectorAll('td,th,li,p,h1,h2,div,tr,br').forEach(function(n){n.appendChild(document.createTextNode(' · '));});
      docs.push({id:p.id,title:h?h.textContent:p.id,text:cl.textContent.replace(/(\s*·\s*)+/g,' · ').replace(/\s+/g,' ').trim()});
    });
    function run(){
      var q=inp.value.trim().toLowerCase().replace(/ё/g,'е');
      if(!q){out.innerHTML='';return;}
      var res=[];
      docs.forEach(function(d){
        var tl=d.title.toLowerCase().replace(/ё/g,'е'),xl=d.text.toLowerCase().replace(/ё/g,'е');
        var inT=find(tl,q)>=0,pos=find(xl,q);
        if(!inT&&pos<0)return;
        var cnt=1,from=Math.max(0,pos-60);
        var snip=d.text.slice(from,pos+q.length+90);
        res.push({d:d,score:(inT?1000:0)+cnt,snip:(from>0?'… ':'')+snip+' …'});
      });
      res.sort(function(a,b){return b.score-a.score;});
      if(!res.length){out.innerHTML='<p>Ничего не найдено по запросу «'+esc(inp.value.trim())+'».</p>';return;}
      out.innerHTML='<p>Найдено статей: '+res.length+'.</p>'+res.slice(0,30).map(function(r){
        return '<p><a href="#'+r.d.id+'"><b>'+esc(r.d.title)+'</b></a><br><span class="sn">'+esc(r.snip)+'</span></p>';
      }).join('');
    }
    form.addEventListener('submit',function(e){e.preventDefault();run();});
    inp.addEventListener('input',run);
  })();
})();

