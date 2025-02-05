

export function setActiveNavItem(_selector = ".item", activeClass = "is-active") {
  const currentPath = window.location.pathname;
  const items = [...document.querySelectorAll(_selector)];

  if(!items.length) {
    console.warn(`setActiveNavItem: No elements found for selector '${_selector}'`);
    return;
  }

  items.forEach(item => {
    const link = item.querySelector("a");
    if(!link) {
      console.warn("setActiveNavItem: No anchor tag found inside", item);
      return;
    }

    const href = link.getAttribute("href");
    if(href === currentPath){
      // console.log(href);
      // console.log(currentPath);

      link.classList.add(activeClass);
    } else {
      link.classList.remove(activeClass);
    }

  })

}