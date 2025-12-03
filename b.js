alert("Bem vindo a Nerv.");

// === Tema / modo escuro com escolhas de cor editáveis ===
(function(){
    function initTheme(){
        try{
            console.log('[theme] inicializando...');
            const root = document.documentElement;
            const themeToggle = document.getElementById('theme-toggle');
            const colorToggle = document.getElementById('color-settings-toggle');
            const colorPanel = document.getElementById('color-panel');
            const mapping = {
                bgColor: '--bg',
                surfaceColor: '--surface',
                textColor: '--text',
                navbarBg: '--navbar-bg',
                navbarText: '--navbar-text',
                textBlockBg: '--text-block-bg'
            };

            function getSavedColors(){ try{ return JSON.parse(localStorage.getItem('siteThemeColors')) || {}; }catch(e){ return {}; } }
            function saveColors(obj){ localStorage.setItem('siteThemeColors', JSON.stringify(obj)); }
            function clearSavedColors(){ localStorage.removeItem('siteThemeColors'); }

            function applyColors(obj){ if(!obj) return; Object.entries(obj).forEach(([k,v])=>{ root.style.setProperty(k, v); }); updateNavbarContrast(); }

            function rgbToHex(cssColor){ if(!cssColor) return '#000000'; cssColor = cssColor.trim(); if(cssColor.startsWith('#')) return cssColor; const m = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i); if(m) return '#'+[1,2,3].map(i=>parseInt(m[i]).toString(16).padStart(2,'0')).join(''); return cssColor; }
            function hexNormalize(h){ if(!h) return h; if(h[0] !== '#') return h; if(h.length===4) return '#'+h[1]+h[1]+h[2]+h[2]+h[3]+h[3]; return h; }

            function setPickerValuesFromComputed(){ const comp = getComputedStyle(root); Object.entries(mapping).forEach(([pickerId,varName])=>{ const el = document.getElementById(pickerId); if(!el) return; const v = comp.getPropertyValue(varName).trim(); el.value = rgbToHex(v); }); }

            function updateNavbarContrast(){ const navbar = document.querySelector('.navbar'); if(!navbar) return; const comp = getComputedStyle(root); const navText = comp.getPropertyValue('--navbar-text').trim(); const navBg = comp.getPropertyValue('--navbar-bg').trim(); // decide whether navbar should be navbar-dark or navbar-light based on text color luminance
                const color = rgbToHex(navText || navBg || '#000');
                const lum = getLuminance(color);
                navbar.classList.remove('navbar-dark','navbar-light');
                if(lum > 0.5) navbar.classList.add('navbar-light'); else navbar.classList.add('navbar-dark');
            }

            function hexToRgb(hex){ hex = hexNormalize(hex); if(!hex) return null; const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i); if(!m) return null; return [parseInt(m[1],16),parseInt(m[2],16),parseInt(m[3],16)]; }
            function getLuminance(hex){ const rgb = hexToRgb(hex); if(!rgb) return 0; const srgb = rgb.map(v=>v/255).map(c=> c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4)); return 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2]; }

            function toggleTheme(){ 
                const isDark = root.classList.toggle('dark'); 
                localStorage.setItem('siteTheme', isDark ? 'dark' : 'light'); 
                console.log('[theme] toggled ->', isDark ? 'dark' : 'light');
                // forçar repaint
                root.style.display='none'; 
                root.offsetHeight; 
                root.style.display='';
                updateNavbarContrast(); 
            }

            // hook events (protegido: verifica existência antes de usar .contains)
            document.addEventListener('click', (e)=>{
                if(!colorPanel) return;
                if(colorToggle && (e.target===colorToggle || colorToggle.contains(e.target))) return;
                if(colorPanel.contains(e.target)) return;
                if(themeToggle && e.target===themeToggle) return;
                colorPanel.style.display='none';
            });

            if(themeToggle) { themeToggle.addEventListener('click', (e)=>{ e.stopPropagation(); toggleTheme(); }); console.log('[theme] botão encontrado e listener adicionado'); }
            else console.log('[theme] botão NÃO encontrado');

            if(colorToggle) colorToggle.addEventListener('click',(e)=>{ e.stopPropagation(); if(!colorPanel) return; colorPanel.style.display = colorPanel.style.display === 'block' ? 'none' : 'block'; setPickerValuesFromComputed(); });

            Object.keys(mapping).forEach(pickerId=>{ const el = document.getElementById(pickerId); if(!el) return; el.addEventListener('input', ()=>{ const varName = mapping[pickerId]; const val = el.value; root.style.setProperty(varName, val); // also save mapping as --name -> value
                    const saved = getSavedColors(); saved[varName] = val; saveColors(saved); updateNavbarContrast(); }); });

            const resetBtn = document.getElementById('reset-colors'); if(resetBtn) resetBtn.addEventListener('click', ()=>{ clearSavedColors(); // remove inline styles we've set
                Object.values(mapping).forEach(v=>{ root.style.removeProperty(v); }); localStorage.removeItem('siteTheme'); root.classList.remove('dark'); setPickerValuesFromComputed(); updateNavbarContrast(); });

            // inicialização
            const savedTheme = localStorage.getItem('siteTheme'); if(savedTheme==='dark') { root.classList.add('dark'); console.log('[theme] aplicado theme do localStorage: dark'); }
            const savedColors = getSavedColors(); if(savedColors && Object.keys(savedColors).length) applyColors(savedColors);
            // garantir pickers atualizados
            setPickerValuesFromComputed();
            updateNavbarContrast();
            console.log('[theme] inicialização completa');
        }catch(err){ console.error('[theme] erro na inicialização', err); }
    }

    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initTheme); else initTheme();
})();

        // === Contador de cliques para a seção de fotos ===
        (function(){
            function initPhotoCounter(){
                const btn = document.getElementById('photo-count-btn');
                const display = document.getElementById('photo-count');
                if(!btn || !display) return;
                const photo = document.getElementById('photo-display');

                // Resetar contador ao carregar (não persistir entre reloads)
                try{ localStorage.removeItem('photoClickCount'); }catch(e){}
                let count = 0;

                function updateDisplayedPhoto(n){
                    if(!photo) return;
                    const newSrc = (n < 10) ? 'img/rei2.png' : (n <= 20 ? 'img/rei3.jpg' : 'img/rei6.jpg');
                    // se já for a mesma src, só garantir opacidade em 1
                    if(photo.src && photo.src.indexOf(newSrc) !== -1){ photo.style.opacity = '1'; return; }
                    // animação de fade: reduzir opacidade, trocar src, então restaurar opacidade quando carregar
                    photo.style.transition = 'opacity 360ms ease';
                    photo.style.opacity = '0';
                    setTimeout(()=>{
                        photo.onload = ()=>{ photo.style.opacity = '1'; };
                        photo.src = newSrc;
                    }, 200);
                }

                display.textContent = count;
                updateDisplayedPhoto(count);

                btn.addEventListener('click', ()=>{
                    count += 1;
                    display.textContent = count;
                    updateDisplayedPhoto(count);
                });
            }
            if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPhotoCounter); else initPhotoCounter();
        })();