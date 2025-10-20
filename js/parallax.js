document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.sidenav');
  if (!nav) return;

  nav.querySelectorAll('li').forEach(li => {
    const submenu = li.querySelector(':scope > ul');
    const link = li.querySelector(':scope > a');
    if (submenu && link) {
      li.classList.add('has-children');

      link.addEventListener('click', (e) => {
        // prevent the page from instantly jumping when you click
        e.preventDefault(); 

        // toggle this li
        li.classList.toggle('open');
      });
    }
  });

  // Auto-open any parents if the current page link is marked .active
  nav.querySelectorAll('a.active').forEach(a => {
    let p = a.parentElement;
    while (p && p !== nav) {
      if (p.matches('li')) p.classList.add('open');
      p = p.parentElement;
    }
  });
});
