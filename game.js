/* Тест знаний «Последняя правка»: демон летает по настоящим страницам Меридипедии */
(function(){
  var WIN=8, MAX_ERR=3, GRACE=0;
  var CLUES={
    map:["Страница с политической, рельефной, климатической картами и картой растительности"],
    timeline:["Перечень событий, на которые чаще всего ссылаются делегации"],
    war:["Конфликт 1927–1934 годов","Война, после которой острова Срединного моря остались неразмежёванными","Война, в которой потерпела поражение Великая Нория"],
    un:["Организация, основанная в 1937 году","Организация, в составе которой есть Комитет по малым государствам"],
    charter:["Документ из сорока двух статей"],
    art4:["Статья Устава о невмешательстве"],
    art6:["Статья Устава с требованиями к государствам-кандидатам"],
    art7:["Статья Устава о приёме новых членов единогласным решением"],
    art12:["Статья Устава, по которой каждый делегат имеет один голос"],
    art15:["Статья Устава о регламенте: любимая шутка Секретариата"],
    registry:["База данных населения, введённая в 1962 году","Что ведёт Статистический отдел ООН: сводка раз в пять лет"],
    index:["Показатель довольства жизнью по шкале от 0 до 10","Показатель, который считается по анкете из 120 утверждений"],
    cold:["Соперничество ФОБ и Амактая как двух моделей общества"],
    space:["Соперничество ФОБ и Амактая за Марс"],
    delay:["Статья о том, как долго идёт радиосигнал до планет"],
    amaktit:["Метеоритный минерал марсианского происхождения"],
    plateau:["Возвышенность, занимающая почти весь Амактай"],
    litk:["Торговая компания, которую Устав не принимает в ООН, потому что принимает только государства"],
    outside:["Тринадцать государств, не входящих в ООН, и два района, не принадлежащих никому"],
    fob:["Страна, которой управляет интеллект-система","Федерация, образованная в 1935 году"],
    amaktai:["Страна без выборов с 1942 года","Страна, где проходит «Честная лотерея»","Страна, где нет ни бедности, ни инфляции"],
    srg:["Страна «открытых ворот» и Горной академии наук","Страна, образованная в 1936 году под девизом «Горы принимают всех»"],
    dolor:["Страна «Промышленного чуда»","Страна, где Комиссия по восстановлению продлевается каждый год с 1946 года","Страна, где строят Башню Возрождения"],
    ezhe:["Самая малая по площади страна — член ООН","Страна с индексом счастья 9,0","Страна, где на дверях домов вывешивают зелёные и жёлтые таблички"],
    island:["Остров на озере Тихом, где заявители ждут решения о въезде"],
    visa:["Форма заявления на въезд в СРГ"],
    portb:["Столица ФОБ"], erdem:["Столица Амактая"], liberti:["Столица СРГ"], milagro:["Столица Долора"], monleru:["Столица Эже-Рузе"],
    fobpop:["Музыкальное направление из ФОБ с главной звездой по имени Кото"]
  };
  window.MERIDIPEDIA_CLUES=CLUES;

  var $=function(i){return document.getElementById(i);};
  var textCount=0,on=false,running=false,ended=false;
  var correct=0,mistakes=0,asked={},visited=[],wrong=0;
  var pageId='',glyphs=[],targetDest='',grace=0,voidLevel=0,eaten=0,lastScan=0,lastMeasure=0,lastFrame=0;
  var tx=0,ty=0,cx=0,cy=0,radius=18,seen=false,attracted=[];
  var root=document.documentElement;

  function activePage(){return document.querySelector('.page.active');}
  function pid(){return (location.hash||'#home').slice(1).split('/')[0];}
  function plural(n,a,b,c){var m=n%100,l=m%10;if(m>=11&&m<=14)return c;if(l===1)return a;if(l>=2&&l<=4)return b;return c;}

  /* --- буквы --- */
  var SKIP='svg,script,style,form,button,select,input,textarea,.gm-w,.tabs';
  function inkPage(p){
    if(p.dataset.gm)return; p.dataset.gm='1';
    var w=document.createTreeWalker(p,NodeFilter.SHOW_TEXT,{acceptNode:function(n){
      if(!n.nodeValue.trim())return NodeFilter.FILTER_REJECT;
      return n.parentElement.closest(SKIP)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}});
    var nodes=[];while(w.nextNode())nodes.push(w.currentNode);
    nodes.forEach(function(n){
      var f=document.createDocumentFragment();
      n.nodeValue.split(/(\s+)/).forEach(function(part){
        if(!part)return;
        if(/^\s+$/.test(part)){f.append(document.createTextNode(part));return;}
        var ws=document.createElement('span');ws.className='gm-w';
        for(var ch of part){var s=document.createElement('span');s.className='gm-l';s.textContent=ch;ws.append(s);}
        f.append(ws);
      });
      n.replaceWith(f);
    });
  }
  function unink(){
    document.querySelectorAll('.page[data-gm]').forEach(function(p){
      p.querySelectorAll('.gm-w').forEach(function(w){w.replaceWith(document.createTextNode(w.textContent));});
      p.normalize(); delete p.dataset.gm;
    });
    document.querySelectorAll('.gm-dead').forEach(function(a){a.classList.remove('gm-dead');});
  }
  function measure(){
    var sx=window.scrollX,sy=window.scrollY;
    glyphs.forEach(function(g){var r=g.el.getBoundingClientRect();g.x=r.left+sx+r.width/2;g.y=r.top+sy+r.height/2;});
    lastMeasure=performance.now();
  }
  function collect(){
    var p=activePage();glyphs=[];attracted=[];eaten=0;textCount=0;
    if(!p)return;
    p.querySelectorAll('.gm-l').forEach(function(el){
      el.classList.remove('gm-eaten','gm-pull');el.style.removeProperty('--px');el.style.removeProperty('--py');
      if(!el.closest('a[href^="#"]'))textCount++;
      glyphs.push({el:el,x:0,y:0,eaten:false,link:el.closest('a[href^="#"]')});
    });
    p.querySelectorAll('.gm-dead').forEach(function(a){a.classList.remove('gm-dead');});
    measure();
  }

  /* --- вопросы --- */
  function destOf(a){return (a.getAttribute('href')||'').slice(1).split('/')[0];}
  /* ссылка реально видна и доступна: не обрезана рамкой SVG и не выше начала страницы */
  function shown(a){
    // ответом бывает только слово-ссылка в тексте: безымянные области карты не считаются
    if(!a.querySelector('.gm-l'))return false;
    var r=a.getBoundingClientRect();
    if(r.width<=0||r.height<=0||r.top+window.scrollY<0)return false;
    var s=a.ownerSVGElement;
    if(s){var q=s.getBoundingClientRect();
      var w=Math.min(r.right,q.right)-Math.max(r.left,q.left),h=Math.min(r.bottom,q.bottom)-Math.max(r.top,q.top);
      if(w<12||h<12)return false;}
    return true;
  }
  function candidates(){
    var p=activePage();if(!p)return[];
    return Array.prototype.filter.call(p.querySelectorAll('a[href^="#"]'),function(a){
      var d=destOf(a);
      if(!CLUES[d]||d===pageId||a.classList.contains('gm-dead')||a.classList.contains('dead'))return false;
      return shown(a);
    });
  }
  function setHint(t,bad){var h=$('gm-hint');h.textContent=t;h.classList.toggle('bad',!!bad);}
  function pickQuestion(msg){
    var c=candidates();
    if(!c.length){targetDest='';$('gm-q').textContent='Все ссылки на странице исчезли';return;}
    var dests=[];c.forEach(function(a){var d=destOf(a);if(dests.indexOf(d)<0)dests.push(d);});
    var seenP={};visited.forEach(function(v){seenP[v]=1;});
    var fresh=dests.filter(function(d){return !asked[d]&&!seenP[d];});
    var rich=fresh.filter(function(d){return outDeg(d,seenP)>=3;});
    var pool=rich.length?rich:fresh.length?fresh:dests.filter(function(d){return !asked[d];});
    if(!pool.length)pool=dests;
    targetDest=pool[Math.floor(Math.random()*pool.length)];
    var cl=CLUES[targetDest];
    $('gm-q').textContent=cl[Math.floor(Math.random()*cl.length)];
    setHint(msg||'Найди в тексте страницы ссылку-ответ и нажми на неё.',false);
    markTarget();
    revealTarget();
  }
  /* ответ всегда должен быть на экране и не под полосой вопроса */
  function revealTarget(){
    var p=activePage();if(!p||!targetDest)return;
    var all=Array.prototype.filter.call(p.querySelectorAll('a[href^="#"]'),function(x){return destOf(x)===targetDest&&shown(x);});
    var a=all.filter(function(x){return x.querySelector('.gm-l');})[0]||all[0];
    // если какая-то ссылка уже на экране, ничего не крутим
    var vis=all.some(function(x){var r=x.getBoundingClientRect();return r.top>=140&&r.bottom<=root.clientHeight-30;});
    if(vis)return;
    if(!a)return;
    var r=a.getBoundingClientRect(),h=root.clientHeight;
    if(r.top<140||r.bottom>h-30)window.scrollTo({top:Math.max(0,window.scrollY+r.top-h/2),behavior:'instant'});
  }
  var GRAPH=null;
  function outDeg(d,seenP){
    if(!GRAPH){GRAPH={};document.querySelectorAll('.page').forEach(function(p){
      var s={};p.querySelectorAll('a[href^="#"]').forEach(function(a){var x=destOf(a);if(CLUES[x]&&x!==p.id)s[x]=1;});GRAPH[p.id]=Object.keys(s);});}
    return (GRAPH[d]||[]).filter(function(x){return !asked[x]&&!seenP[x]&&x!==d;}).length;
  }
  function markTarget(){
    var p=activePage();if(!p)return;
    p.querySelectorAll('a[href^="#"]').forEach(function(a){if(destOf(a)===targetDest)a.dataset.gmT='1';else delete a.dataset.gmT;});
  }

  /* --- интерфейс --- */
  function hud(){
    $('gm-label').textContent='Вопрос '+Math.min(correct+1,WIN)+' из '+WIN;
    $('gm-score').textContent=correct+' / '+WIN;
    var lv=$('gm-lives');lv.textContent='';
    for(var i=0;i<MAX_ERR;i++){var s=document.createElement('i');if(i<mistakes)s.className='lost';lv.append(s);}
    $('gm-meter').style.width=Math.min(100,voidLevel)+'%';
    $('gm-meter').classList.toggle('hot',voidLevel>=70);
    $('gm-sleep').textContent=(!running)?'':'демон охотится';
  }
  function chaserStyle(){
    radius=18+voidLevel*.9+Math.min(3,mistakes);
    root.style.setProperty('--gm-x',cx+'px');root.style.setProperty('--gm-y',cy+'px');
    root.style.setProperty('--gm-r',radius+'px');root.style.setProperty('--gm-s',(36+voidLevel*2)+'px');
  }
  function resetChaser(){
    var w=root.clientWidth,h=root.clientHeight;
    if(!seen){tx=w*.6;ty=h*.6;}
    cx=Math.max(20,Math.min(w-20,tx-260));cy=Math.max(130,Math.min(h-20,ty+40));
    chaserStyle();
  }
  function prepare(force){
    if(!on||ended)return;
    var id=pid(); if(!force&&id===pageId&&glyphs.length)return;
    var p=activePage(); if(!p)return;
    pageId=id; inkPage(p); collect();
    if(visited[visited.length-1]!==id)visited.push(id);
    voidLevel=0;wrong=0;grace=0;if(visited.length<=1)resetChaser();
    pickQuestion(); hud();
  }

  function finish(won,why){
    ended=true;running=false;
    $('gm-end-k').textContent=won?'Тест пройден':'Тест провален';
    $('gm-end-t').textContent=won?'Ты выбрался из сети.':'Демон победил.';
    var e=mistakes+' '+plural(mistakes,'ошибка','ошибки','ошибок');
    $('gm-end-m').textContent=won?('Верных ответов: '+correct+' из '+WIN+', '+e+'. Ты знаешь Меридипедию.')
      :((why==='err'?'Три ошибки.':why==='links'?'На странице не осталось ссылок для вопроса.':why==='page'?'Демон съел слишком много текста и вырос.':'Демон догнал курсор.')+' Верных ответов: '+correct+' из '+WIN+'. Попробуй ещё раз: все ответы есть в статьях.');
    $('gm-end').hidden=false;$('gm-again').focus();
  }

  function begin(){
    correct=0;mistakes=0;asked={};visited=[];wrong=0;voidLevel=0;ended=false;running=false;seen=false;pageId='';glyphs=[];
    $('gm-start').hidden=true;$('gm-end').hidden=true;
    document.body.classList.add('gm-on');on=true;
    var go=function(){prepare(true);running=true;};
    if(pid()!=='home'){location.hash='#home';setTimeout(go,60);}else go();
  }
  function open(){ // показать правила
    document.body.classList.add('gm-on');on=true;running=false;ended=false;
    $('gm-start').hidden=false;$('gm-go').focus();
  }
  function exit(){
    on=false;running=false;ended=false;
    document.body.classList.remove('gm-on');
    $('gm-start').hidden=true;$('gm-end').hidden=true;
    unink();glyphs=[];attracted=[];
    if(pid()!=='demon')location.hash='#demon';
  }

  /* --- движение --- */
  function frame(ts){
    var dt=Math.min(.05,Math.max(0,(ts-lastFrame)/1000));lastFrame=ts;
    if(on&&running&&!ended&&!document.hidden){
      if(performance.now()>=grace){
        var dx=tx-cx,dy=ty-cy,d=Math.hypot(dx,dy);
        var step=(100+Math.min(correct,8)*8+Math.min(wrong,4)*20)*dt;
        if(d>0){var k=Math.min(1,step/d);cx+=dx*k;cy+=dy*k;}
        chaserStyle();
        if(ts-lastMeasure>1500)measure();
        var sx=window.scrollX,sy=window.scrollY,range=92,i,g,vx,vy,dd;
        // притяжение
        var now=[];
        for(i=0;i<glyphs.length;i++){
          g=glyphs[i];if(g.eaten)continue;
          vx=cx-(g.x-sx);vy=cy-(g.y-sy);
          if(vx>range||vx<-range||vy>range||vy<-range)continue;
          dd=Math.hypot(vx,vy);if(dd>=range)continue;
          if(g.link)continue;
          var f=Math.min(8,(range-dd)*.13);
          g.el.classList.add('gm-pull');g.el.style.setProperty('--px',(vx/dd*f)+'px');g.el.style.setProperty('--py',(vy/dd*f)+'px');
          now.push(g);
        }
        attracted.forEach(function(g){if(now.indexOf(g)<0&&!g.eaten){g.el.classList.remove('gm-pull');g.el.style.removeProperty('--px');g.el.style.removeProperty('--py');}});
        attracted=now;
        // поедание
        if(ts-lastScan>25){
          lastScan=ts;
          var best=null,bd=radius+30;
          for(i=0;i<glyphs.length;i++){
            g=glyphs[i];if(g.eaten)continue;
            if(g.link)continue;
            dd=Math.hypot(g.x-sx-cx,g.y-sy-cy);if(dd<bd){bd=dd;best=g;}
          }
          if(best){
            var r=best.el.getBoundingClientRect();
            best.el.style.setProperty('--fx',(cx-r.left)+'px');best.el.style.setProperty('--fy',(cy-r.top)+'px');
            best.el.classList.add('gm-eaten');best.eaten=true;eaten++;
          }
          voidLevel=Math.min(100,eaten/Math.max(1,Math.min(textCount,200))*100);
          // пометить ответ
          if(!targetDest&&glyphs.length&&!candidates().length)finish(false,'links');
          hud();
          if(voidLevel>=100)finish(false,'page');
        }
        if(Math.hypot(tx-cx,ty-cy)<18)finish(false,'caught');
      } else hud();
    }
    requestAnimationFrame(frame);
  }

  /* --- события --- */
  document.addEventListener('pointermove',function(e){tx=e.clientX;ty=e.clientY;seen=true;root.style.setProperty('--gm-cx',tx+'px');root.style.setProperty('--gm-cy',ty+'px');});
  document.addEventListener('click',function(e){
    if(!on)return;
    var a=e.target.closest&&e.target.closest('main a[href^="#"]');
    if(!a)return;
    e.preventDefault();e.stopPropagation();
    if(!running||ended)return;
    var d=destOf(a);
    if(!a.querySelector('.gm-l')){setHint('Ответ — слово-ссылка в тексте, а не область на карте.',true);return;}
    if(!CLUES[d]&&d!=='home'){setHint('Эта ссылка в тесте не участвует.',true);return;}
    if(d!==targetDest){
      mistakes++;wrong++;hud();
      if(mistakes>=MAX_ERR){finish(false,'err');return;}
      setHint('Не то. Ошибок: '+mistakes+' из '+MAX_ERR+', демон ускорился. Перечитай вопрос.',true);
      return;
    }
    asked[d]=1;correct++;
    if(correct>=WIN){hud();finish(true);return;}
    location.hash='#'+a.getAttribute('href').slice(1);
    setTimeout(function(){prepare(true);window.scrollTo(0,0);},30);
  },true);
  window.addEventListener('popstate',function(){setTimeout(function(){prepare(false);},30);});
  window.addEventListener('hashchange',function(){setTimeout(function(){prepare(false);},30);});
  window.addEventListener('resize',function(){if(on)measure();});
  document.addEventListener('keydown',function(e){if(on&&e.key==='Escape')exit();});

  function init(){
    var s=$('demon-start');if(s)s.addEventListener('click',open);
    $('gm-go').addEventListener('click',function(){if(on&&!ended&&glyphs.length){running=true;grace=0;$('gm-start').hidden=true;}else begin();});
    $('gm-again').addEventListener('click',begin);
    $('gm-help').addEventListener('click',function(){running=false;$('gm-start').hidden=false;$('gm-go').textContent=ended?'Начать':'Продолжить';});
    $('gm-quit').addEventListener('click',exit);$('gm-end-quit').addEventListener('click',exit);
    requestAnimationFrame(frame);
  }
  init();
  window.__gm={cands:function(){return candidates().map(destOf);},reveal:function(d){targetDest=d;markTarget();revealTarget();},begin:begin,state:function(){return{correct:correct,mistakes:mistakes,targetDest:targetDest,pageId:pageId,ended:ended,glyphs:glyphs.length};}};
})();
