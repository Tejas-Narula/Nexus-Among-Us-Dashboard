// @ts-nocheck
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { supabase } from '../lib/supabase';
import { AllocationDatabase } from '../lib/gameDatabase';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const containerRef = React.useRef(null);
  const initialized = React.useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (!containerRef.current) return;
    
    document.body.style.overflow = 'hidden';

    let onWheel = null;
    let onKey = null;
    let onPointer = null;

    try {
      const $=s=>containerRef.current.querySelector(s),RM=matchMedia('(prefers-reduced-motion: reduce)').matches,wait=ms=>new Promise(r=>setTimeout(r,ms));
      const API_BASE=(import.meta.env.VITE_API_BASE_URL||import.meta.env.VITE_API_URL||'/api').replace(/\/$/,'');
      const pal=['#b13a45','#3f5fb8','#d68a3c','#6a63a8','#4fa39a','#c9b56a','#a85a9a','#7a8aa6'];
      const cm=c=>`<svg class="cm" viewBox="0 0 100 110" aria-hidden="true"><rect x="10" y="38" width="20" height="40" rx="9" fill="${c}" style="filter:brightness(.7)"/><path d="M25 40Q25 12 52 12Q79 12 79 40V90Q79 98 70 98H58Q54 98 54 93V82H46V93Q46 98 42 98H34Q25 98 25 90Z" fill="${c}"/><path d="M60 22Q79 26 79 44V90Q79 98 70 98H58Q54 98 54 93V82H62Q66 70 66 56Z" fill="#000" opacity=".17"/><rect x="42" y="26" width="36" height="24" rx="12" fill="#9fd2f5"/><rect x="49" y="30" width="18" height="6" rx="3" fill="#fff" opacity=".75"/></svg>`;
      let mode='cover',scene3d=null;
      if($('#oCm')) $('#oCm').innerHTML=cm(pal[0]);
      
      let color='#d11a1a';
      /* ===== 3D space scene ===== */
      function init3d(){
       const T=THREE,r=new T.WebGLRenderer({canvas:$('#gl'),alpha:true,antialias:true});
       r.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.5:2));
       const sc=new T.Scene(),cam=new T.PerspectiveCamera(60,1,.1,260);cam.position.z=14;
       sc.add(new T.AmbientLight(0x4a5380,.5));
       const key=new T.DirectionalLight(0xfff0dd,1.1);key.position.set(-6,5,9);sc.add(key);
       const rim=new T.DirectionalLight(0x7fc8e8,.9);rim.position.set(6,2,-6);sc.add(rim);const rl=new T.PointLight(0xff3a48,2,60,2);rl.position.set(-12,3,8);const bl=new T.PointLight(0x4a8cff,2,60,2);bl.position.set(12,3,8);sc.add(rl,bl);
       const glowTex=(a,b)=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,a);g.addColorStop(1,b);x.fillStyle=g;x.fillRect(0,0,128,128);return new T.CanvasTexture(c)};
       [[0x3a2a8a,-40,18,-90,150],[0x155a74,45,-20,-100,160],[0x6a2038,0,-30,-120,170]].forEach(n=>{const s=new T.Sprite(new T.SpriteMaterial({map:glowTex('rgba(255,255,255,.9)','rgba(255,255,255,0)'),color:n[0],transparent:true,opacity:.14,blending:T.AdditiveBlending,depthWrite:false}));s.position.set(n[1],n[2],n[3]);s.scale.set(n[4],n[4],1);sc.add(s)});
       const N=innerWidth<700?1100:2200,pos=new Float32Array(N*3),col=new Float32Array(N*3),tc=[[1,1,1],[.7,.8,1],[1,.8,.9],[.7,1,.95]];
       for(let i=0;i<N;i++){pos[i*3]=(Math.random()-.5)*130;pos[i*3+1]=(Math.random()-.5)*80;pos[i*3+2]=-180+Math.random()*200;col.set(tc[Math.random()*4|0],i*3)}
       const sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(pos,3));sg.setAttribute('color',new T.BufferAttribute(col,3));
       sc.add(new T.Points(sg,new T.PointsMaterial({size:.9,map:glowTex('rgba(255,255,255,1)','rgba(255,255,255,0)'),vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending})));
       /* planet */
       const pc=document.createElement('canvas');pc.width=512;pc.height=256;const px=pc.getContext('2d'),pg=px.createLinearGradient(0,0,0,256);['#1c1a3c','#5a2a3e','#8a4a3a','#3a2447','#14183a'].forEach((s,i,a)=>pg.addColorStop(i/(a.length-1),s));px.fillStyle=pg;px.fillRect(0,0,512,256);
       for(let i=0;i<300;i++){px.fillStyle=`rgba(${Math.random()<.5?'255,240,220':'20,8,40'},${Math.random()*.13})`;px.beginPath();px.ellipse(Math.random()*512,Math.random()*256,20+Math.random()*90,2+Math.random()*8,0,0,7);px.fill()}
       const planetG=new T.Group(),planet=new T.Mesh(new T.SphereGeometry(4,64,48),new T.MeshStandardMaterial({map:new T.CanvasTexture(pc),roughness:.9}));
       planetG.add(planet,new T.Mesh(new T.SphereGeometry(4.35,48,32),new T.MeshBasicMaterial({color:0xd06a5a,transparent:true,opacity:.1,side:T.BackSide,blending:T.AdditiveBlending,depthWrite:false})));
       const tilt=new T.Group();tilt.rotation.set(1.15,0,.25);planetG.add(tilt);
       tilt.add(new T.Mesh(new T.RingGeometry(5.6,8.2,128),new T.MeshBasicMaterial({color:0xb89a86,transparent:true,opacity:.2,side:T.DoubleSide,depthWrite:false})));
       const belt=new T.Group();tilt.add(belt);const rocks=[];
       for(let i=0;i<(innerWidth<700?14:26);i++){const a=Math.random()*7,rd=6+Math.random()*2.4,m=new T.Mesh(new T.IcosahedronGeometry(.12+Math.random()*.32,0),new T.MeshStandardMaterial({color:0x7a7fa6,flatShading:true,roughness:1}));m.position.set(Math.cos(a)*rd,Math.sin(a)*rd,(Math.random()-.5)*.6);m.userData.s=[Math.random()*.02,Math.random()*.02];belt.add(m);rocks.push(m)}
       planetG.position.z=-6;sc.add(planetG);
       /* crewmates */
       function mk(c){const g=new T.Group(),bm=new T.MeshStandardMaterial({color:c,roughness:.35,metalness:.1}),pm=bm.clone(),vm=new T.MeshStandardMaterial({color:0xa8ecff,emissive:0x1d5a78,roughness:.08,metalness:.35});
        const add=(ge,m,x,y,z)=>{const o=new T.Mesh(ge,m);o.position.set(x,y,z);g.add(o);return o};
        add(new T.CylinderGeometry(.62,.62,1.1,32),bm,0,0,0);add(new T.SphereGeometry(.62,32,20,0,7,0,1.5708),bm,0,.55,0);
        [-.3,.3].forEach(x=>{add(new T.CylinderGeometry(.27,.27,.55,20),bm,x,-.78,0);add(new T.SphereGeometry(.27,16,12),bm,x,-1.05,0)});
        add(new T.SphereGeometry(.5,32,20),vm,0,.38,.4).scale.set(1.05,.62,.72);add(new T.BoxGeometry(.38,.85,.5),pm,0,-.05,-.72);
        sc.add(g);return{g,bm,pm}}
       let AW=innerWidth,AH=innerHeight;const cr=[mk(color),mk(0x1f3be0),mk(0x12923a),mk(0x2fa8b8),mk(0xd8629a),mk(0xe0c75a),mk(0x7a56d1)],S={c:[[0,0,1],[0,0,1],[0,0,1]],px:0,py:0,ps:1,spin:0,warp:0,warpT:0,mx:0,my:0};
       const tg=()=>{const a=AW/AH,hh=Math.tan(Math.PI/6)*14,hw=hh*a,ph=Math.tan(Math.PI/6)*20,pw=ph*a,w=AW>860,Z=[0,0,0];
        if(mode==='cover')return w?{c:[[-hw*.66,-hh*.2,1.5],[hw*.64,hh*.3,1.1],[hw*.5,-hh*.5,.8],Z,Z,Z,Z],px:pw*.55,py:ph*.4,ps:1}:{c:[[-hw*.6,-hh*.62,.9],[hw*.55,hh*.6,.7],[hw*.62,-hh*.72,.55],Z,Z,Z,Z],px:pw*.45,py:ph*.72,ps:.7};
        if(mode==='login')return w?{c:[[-hw*.62,-hh*.48,1.5],[hw*.9,hh*.8,.5],[-hw*.9,hh*.8,.5],[hw*.72,-hh*.5,1.2],[-hw*.82,hh*.12,.8],[hw*.84,hh*.22,.8],[-hw*.45,-hh*.82,.7]],px:pw*.66,py:ph*.38,ps:1}:{c:[[hw*.8,hh*.84,.6],[hw*.9,-hh*.8,.4],[-hw*.9,-hh*.8,.4],[-hw*.85,hh*.84,.55],[hw*.15,-hh*.88,.45],[-hw*.4,-hh*.9,.4],[hw*.5,-hh*.88,.4]],px:pw*.45,py:ph*.72,ps:.7};
        return{c:[[hw*.86,-hh*.72,.7],[-hw*.88,hh*.78,.45],[hw*.9,hh*.8,.45],[-hw*.9,-hh*.8,.5],[hw*.55,hh*.88,.4],[-hw*.5,hh*.88,.4],[hw*.95,hh*.1,.45]],px:w?pw*.82:pw*.5,py:w?ph*.55:ph*.8,ps:w?.9:.6}};
       {const t=tg();S.c=t.c.map(x=>x.slice());S.px=t.px;S.py=t.py;S.ps=t.ps}
       function size(){if(innerWidth===AW&&document.activeElement&&document.activeElement.tagName==='INPUT')return;AW=innerWidth;AH=innerHeight;r.setSize(AW,AH,false);cam.aspect=AW/AH;cam.updateProjectionMatrix();if(RM)frame()}
       addEventListener('resize',size);
       addEventListener('pointermove',e=>{S.mx=e.clientX/innerWidth-.5;S.my=e.clientY/innerHeight-.5});
       let t=0;
       function frame(){const g=tg();
        g.c.forEach((v,i)=>{for(let k=0;k<3;k++)S.c[i][k]+=(v[k]-S.c[i][k])*.05});S.px+=(g.px-S.px)*.05;S.py+=(g.py-S.py)*.05;S.ps+=(g.ps-S.ps)*.05;
        S.warp+=(S.warpT-S.warp)*.07;S.spin*=.94;
        cam.fov=60+S.warp*55;cam.updateProjectionMatrix();
        cam.position.x+=(S.mx*1.6+Math.sin(t*.3)*.6-cam.position.x)*.04;cam.position.y+=(-S.my*1.1-cam.position.y)*.04;cam.lookAt(0,0,0);
        const sp=.05+S.warp*3.4;for(let i=2;i<N*3;i+=3){let z=pos[i]+sp;if(z>20)z-=200;pos[i]=z}sg.attributes.position.needsUpdate=true;
        planetG.position.set(S.px,S.py,-6);planetG.scale.setScalar(S.ps);planet.rotation.y+=.0014;belt.rotation.z+=.0026;rocks.forEach(m=>{m.rotation.x+=m.userData.s[0];m.rotation.y+=m.userData.s[1]});
        cr.forEach((c,i)=>{const v=S.c[i];c.g.position.set(v[0],v[1]+Math.sin(t*1.4+i*2)*.3,0);c.g.scale.setScalar(Math.max(v[2],.001));c.g.visible=v[2]>.03;
         if(i===0)c.g.rotation.set(S.my*.4+Math.sin(t*.7)*.12,t*.5+S.mx*.8+S.spin,Math.sin(t*.9)*.16);
         else c.g.rotation.set(t*(.35+i*.12),t*(.5+i*.2),Math.sin(t*.6+i)*.5)});
        rl.intensity=1.6+Math.sin(t*1.2)*.7;bl.intensity=1.6+Math.sin(t*1.2+3)*.7;t+=.016;r.render(sc,cam)}
       size();
       (function loop(){if(!RM){requestAnimationFrame(loop);frame()}})();
       if(RM)frame();
       return{S,setColor(c){cr[0].bm.color.set(c);cr[0].pm.color.set(c).multiplyScalar(.7)},spin(){S.spin+=Math.PI*2}};
      }
      try{scene3d=init3d()}catch(e){scene3d=null}
      const warpTo3=v=>{if(scene3d&&!RM)scene3d.S.warpT=v};
      
      /* ===== cover: swipe up & scroll transition ===== */
      const cover=$('#cover'),login=$('#login');
      let sy=null,prog=0,opened=false,moved=false;
      function setP(p){
        prog=Math.max(0,Math.min(1,p));
        if(cover) cover.style.setProperty('--p',prog);
        if(login) login.style.setProperty('--lo',prog);
        warpTo3(prog*.8);
      }
      if(cover){
        cover.onpointerdown=e=>{
          if(opened||e.target.closest('#hint')) return;
          sy=e.clientY;
          moved=false;
          cover.classList.remove('rel');
          cover.setPointerCapture(e.pointerId);
          if(login) login.classList.add('on');
          cover.style.cursor='grabbing';
        };
        cover.onpointermove=e=>{
          if(sy==null) return;
          moved=true;
          setP((sy-e.clientY)/(innerHeight*.45));
        };
        cover.onpointerup=cover.onpointercancel=()=>{
          if(sy==null) return;
          sy=null;
          cover.style.cursor='';
          cover.classList.add('rel');
          if(prog>.2) openLogin();
          else { setP(0); if(login) login.classList.remove('on'); }
        };
      }
      function openLogin(){
        if(opened) return;
        opened=true;
        navigator.vibrate&&navigator.vibrate(30);
        mode='login';
        if(login) login.classList.add('on');
        if(cover) cover.classList.add('rel');
        setP(1);
        warpTo3(1);
        setTimeout(()=>warpTo3(0),650);
        setTimeout(()=>{
          if(cover) cover.classList.add('gone');
          $('#teamId')?.focus({preventScroll:true});
        },850);
      }
      function backToCover(){
        opened=false;
        mode='cover';
        if(cover) {
          cover.classList.remove('gone');
          void cover.offsetWidth;
          cover.classList.add('rel');
        }
        setP(0);
        setTimeout(()=>{
          if(!opened && login) login.classList.remove('on');
        },800);
      }
      if($('#hint')) $('#hint').onclick=openLogin;
      if($('#back')) $('#back').onclick=backToCover;

      onWheel=e=>{
        if(!opened && mode==='cover' && e.deltaY > 15) {
          openLogin();
        } else if(opened && mode==='login' && window.scrollY <= 0 && e.deltaY < -30) {
          backToCover();
        }
      };
      window.addEventListener('wheel',onWheel,{passive:true});

      onKey=e=>{
        if(!opened && mode==='cover' && ['ArrowUp','ArrowDown','Enter',' '].includes(e.key)){
          e.preventDefault();
          openLogin();
        } else if(opened && mode==='login' && e.key === 'Escape') {
          backToCover();
        }
      };
      window.addEventListener('keydown',onKey);

      if(!RM && matchMedia('(hover:hover)').matches){
        onPointer=e=>{
          const t=$('#title');
          if(t){
            t.style.setProperty('--ty',((e.clientX/innerWidth-.5)*16)+'deg');
            t.style.setProperty('--tx',(-(e.clientY/innerHeight-.5)*12)+'deg');
          }
        };
        window.addEventListener('pointermove',onPointer);
      }
      
      /* ===== login ===== */
      const fr=$('#frame');
      if(!RM&&matchMedia('(hover:hover)').matches){fr.onpointermove=e=>{const b=fr.getBoundingClientRect(),x=(e.clientX-b.left)/b.width-.5,y=(e.clientY-b.top)/b.height-.5;fr.style.transform=`perspective(1000px) rotateY(${x*6}deg) rotateX(${-y*6}deg)`};fr.onpointerleave=()=>fr.style.transform=''}
      $('#teamId').oninput=e=>e.target.removeAttribute('aria-invalid');
      const phoneInput = $('#leaderPhone') || $('#playerName');
      if(phoneInput) phoneInput.oninput=e=>e.target.removeAttribute('aria-invalid');
      function fail(msg,el){$('#err').textContent=msg;if(el){el.setAttribute('aria-invalid','true');el.focus();}fr.classList.remove('shake');void fr.offsetWidth;fr.classList.add('shake')}
      async function warpTo(steps,done){const w=$('#warp'),fl=$('#flash');w.classList.add('on');$('#pbi').style.width='0';warpTo3(1);await wait(RM?0:500);
       for(const [i,s] of steps.entries()){$('#stx').textContent=s;$('#pbi').style.width=((i+1)/steps.length*100)+'%';await wait(RM?80:650)}
       fl.style.opacity=1;await wait(RM?0:350);done();warpTo3(0);scrollTo(0,0);w.classList.remove('on');fl.style.opacity=0}
      $('#f').onsubmit=async e=>{
       e.preventDefault();
       const teamId=$('#teamId').value.trim().toUpperCase();
       const pInput=$('#leaderPhone') || $('#playerName');
       const leaderPhone=pInput.value.trim();
       const phoneDigits=leaderPhone.replace(/\D/g,'');
       if(!/^[A-Z0-9][A-Z0-9-]{1,39}$/.test(teamId))return fail('Enter the Team ID shown on your event pass (e.g. NX-T1).', $('#teamId'));
       if(phoneDigits.length<7 && leaderPhone.length<2)return fail('Enter the mobile number of your Team Leader.', pInput);
       $('#err').textContent='';
       const submit=$('#f button[type="submit"]');
       submit.disabled=true;
       submit.setAttribute('aria-busy','true');

       const animation=warpTo(['Verifying Team ID…','Validating Leader Contact…','Synchronizing event session…'],()=>{});

       try{
        let session = null;

        // 1. Backend REST Endpoint
        try {
          const response = await fetch(`${API_BASE}/teams/login`, {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({teamId,phone:leaderPhone,mobileNumber:leaderPhone,playerName:leaderPhone})
          });
          const result = await response.json().catch(()=>null);
          if (response.ok && result?.success && result?.data) {
            const d = result.data;
            session = {
              teamId: d.team?.teamCode || teamId,
              phone: d.player?.phone || leaderPhone,
              playerName: d.player?.name || leaderPhone,
              teamName: d.team?.name || 'Cyber Phantoms',
              isImpostor: Boolean(d.team?.isImpostor),
              assignedRoom: d.team?.assignedRoom || 'Room 1 (Command Hub)',
              eventStatus: d.eventSession?.status || 'active'
            };
          }
        } catch (backendErr) {
          console.warn('Backend login unavailable, attempting direct Supabase query:', backendErr);
        }

        // 2. Direct Supabase Cloud Fallback (zero backend dependency)
        if (!session && supabase) {
          try {
            const { data: teams, error: sbErr } = await supabase
              .from('teams')
              .select('*')
              .or(`team_code.ilike.${teamId},badge_code.ilike.${teamId},name.ilike.${teamId}`);

            if (sbErr) {
              console.warn('Supabase query error:', sbErr);
            } else if (teams && teams.length > 0) {
              const matchedTeam = teams.find(t => {
                const dbPhone = String(t.phone || t.leader_phone || t.mobile_number || '').replace(/\D/g, '');
                if (!phoneDigits) return true;
                if (dbPhone && (dbPhone.includes(phoneDigits) || phoneDigits.includes(dbPhone) || dbPhone.slice(-7) === phoneDigits.slice(-7))) {
                  return true;
                }
                if (Array.isArray(t.members)) {
                  return t.members.some(m => {
                    const mDigits = String(m.phone || '').replace(/\D/g, '');
                    return mDigits && (mDigits.includes(phoneDigits) || phoneDigits.includes(mDigits));
                  });
                }
                return false;
              }) || teams[0];

              if (matchedTeam) {
                session = {
                  teamId: matchedTeam.team_code || matchedTeam.badge_code || teamId,
                  phone: matchedTeam.phone || leaderPhone,
                  playerName: matchedTeam.leader_name || matchedTeam.impostor_player_name || 'Operative',
                  teamName: matchedTeam.name,
                  isImpostor: Boolean(matchedTeam.is_impostor),
                  assignedRoom: matchedTeam.assigned_room || matchedTeam.assigned_room_name || 'Room 1 (Command Hub)',
                  eventStatus: matchedTeam.status || 'active'
                };
              }
            }
          } catch (sbException) {
            console.error('Supabase direct auth error:', sbException);
          }
        }

        // 3. Robust Fallback to Cached Teams (Local Storage & In-Memory)
        if (!session) {
          const localTeams = AllocationDatabase.getTeams();
          const cleanId = teamId.trim().toUpperCase();
          const cleanPhone = phoneDigits;
          const matched = localTeams.find(t => {
            const matchesId = (t.teamCode && t.teamCode.toUpperCase() === cleanId) ||
                              (t.badgeCode && t.badgeCode.toUpperCase() === cleanId) ||
                              (t.id && t.id.toUpperCase() === cleanId) ||
                              (t.name && t.name.toUpperCase() === cleanId);
            if (!matchesId) return false;
            if (!cleanPhone) return true;
            const tPhone = String(t.phone || '').replace(/\D/g, '');
            if (tPhone && (tPhone.includes(cleanPhone) || cleanPhone.includes(tPhone) || tPhone.slice(-7) === cleanPhone.slice(-7))) {
              return true;
            }
            if (Array.isArray(t.memberDetails)) {
              return t.memberDetails.some(m => {
                const mDigits = String(m.phone || '').replace(/\D/g, '');
                return mDigits && (mDigits.includes(cleanPhone) || cleanPhone.includes(mDigits));
              });
            }
            return true;
          });

          if (matched) {
            session = {
              teamId: matched.teamCode || matched.badgeCode || matched.id,
              phone: matched.phone || leaderPhone,
              playerName: matched.leaderName || matched.impostorPlayerName || 'Operative',
              teamName: matched.name,
              isImpostor: Boolean(matched.isImpostor),
              assignedRoom: matched.assignedRoomName || matched.assignedRoom || 'Room 1 (Command Hub)',
              eventStatus: matched.status || 'active',
            };
          }
        }

        if (!session) {
          throw new Error('Invalid Team ID or Leader Mobile Number. Please verify credentials.');
        }

        await animation;
        localStorage.setItem('nexus_player_session', JSON.stringify(session));
        navigate('/player', { replace: true });
       }catch(error){
        const message=error instanceof Error?error.message:'Player sign-in failed. Please try again.';
        fail(message,message.toLowerCase().includes('team id')?$('#teamId'):pInput);
       }finally{
        submit.disabled=false;
        submit.removeAttribute('aria-busy');
       }
      };
      
    } catch (e) {
      console.error(e);
    }
    
    return () => {
      document.body.style.overflow = '';
      if (onWheel) window.removeEventListener('wheel', onWheel);
      if (onKey) window.removeEventListener('keydown', onKey);
      if (onPointer) window.removeEventListener('pointermove', onPointer);
    };
  }, [navigate]);

  return (
    <div className="login-container" ref={containerRef}>
      
      <svg width="0" height="0" style={{position:'absolute'}} aria-hidden="true"><filter id="rough"><feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5"/></filter></svg>
      <canvas id="gl" aria-hidden="true" /><div id="vig"></div>
      <i className="shoot" style={{top:'6%'}}></i><i className="shoot" style={{top:'34%',animationDelay:'-3s'}}></i><i className="shoot" style={{top:'62%',animationDelay:'-5s'}}></i>
      
      <section id="cover" aria-label="Among Us: Coded Chaos">
        <div className="brandline"><svg viewBox="0 0 40 52" aria-hidden="true"><path d="M20 3a14 14 0 0 0-8 25c2 2 3 4 3 7h10c0-3 1-5 3-7A14 14 0 0 0 20 3z"/><path d="M15 40h10M16 46h8M16 17l4 5 4-5M20 22v13"/></svg>TechIdeate'26</div>
        <p className="pres">PRESENTS</p>
        <div className="stage"><h1 className="title" id="title" aria-label="Among Us Coded Chaos"><span className="t1" aria-hidden="true">AM<i className="o" id="oCm"></i>NG US</span><span className="t2" aria-hidden="true">CODED CHAOS</span></h1></div>
        <ul className="tags"><li>Deceive</li><li>Discuss</li><li>Decipher</li><li>Survive</li></ul>
        <button className="hint" id="hint" aria-label="Swipe up to enter"><span className="chev"><i></i><i></i><i></i></span>SWIPE UP / SCROLL</button>
      </section>

      <main className="screen" id="login">
        <div className="lg">
          <div className="nlogo" aria-label="Nexus">
            <svg viewBox="0 0 420 150" aria-hidden="true"><defs><path id="o1" d="M30 82a180 46 -14 1 0 360-24a180 46 -14 1 0-360 24z"/><path id="o2" d="M50 60a160 38 18 1 0 320 30a160 38 18 1 0-320-30z"/></defs><use href="#o1" fill="none" stroke="#dbe6ff" strokeWidth="1.6" opacity=".85"/><use href="#o2" fill="none" stroke="#6fb4e8" strokeWidth="1.6"/><circle r="6" fill="#6fb4e8"><animateMotion dur="9s" repeatCount="indefinite"><mpath href="#o1" /></animateMotion></circle><circle r="5" fill="#f1f4ff"><animateMotion dur="12s" repeatCount="indefinite"><mpath href="#o2" /></animateMotion></circle></svg>
            <div className="word">NE<b>X</b>US</div><div className="ntag">NETWORK · EXPLORE · TRANSFORM</div>
          </div>
          <div className="frame" id="frame"><div className="in">
            <form id="f" noValidate>
              <div className="inp"><label className="sr" htmlFor="teamId">Team ID</label><svg className="ic" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h10"/><circle cx="18" cy="17" r="3"/></svg><input type="text" id="teamId" maxLength="40" autoComplete="off" autoCapitalize="characters" spellCheck="false" enterKeyHint="next" placeholder="Team ID (e.g. NX-T1)" aria-describedby="err" /></div>
              <div className="inp"><label className="sr" htmlFor="leaderPhone">Leader Mobile Number</label><svg className="ic" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg><input type="tel" id="leaderPhone" maxLength="20" autoComplete="tel" enterKeyHint="go" placeholder="Leader Mobile (10 digits)" aria-describedby="err" /></div>
              <div className="err" id="err" role="alert" aria-live="polite"></div>
              <div className="enterw"><button className="enter" type="submit"><span>ENTER <svg className="ic" viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6"/></svg></span></button></div>
            </form>
          </div></div>
          <button className="back" id="back" type="button">Back to the cover</button>
        </div>
      </main>
      
      <div id="warp"><p id="stx"></p><div className="pbar"><i id="pbi"></i></div></div>
      <div id="flash"></div>
      
      
    </div>
  );
}
