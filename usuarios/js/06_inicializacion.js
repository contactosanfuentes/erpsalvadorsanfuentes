document.addEventListener('click',e=>{
  if(!e.target.closest('.asesorado-search'))
    document.querySelectorAll('[id^="ap-resultados-"]').forEach(d=>d.style.display='none');
});

init();