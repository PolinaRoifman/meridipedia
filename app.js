(function(){
  var pages=document.querySelectorAll('.page');
  if('scrollRestoration' in history)history.scrollRestoration='manual';
  function route(restore){
    var raw=(location.hash||'#home').slice(1).split('/');
    var h=raw[0],sub=raw[1];
    var found=false;
    pages.forEach(function(p){var on=p.id===h; p.classList.toggle('active',on); if(on)found=true;});
    if(!found){document.getElementById('gone').classList.add('active');}
    if(h==='index')drawChart();
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

  route(false);
})();

