import { allowedList, sponsoredTexts, blockedList } from "./constants";

function isHidden(e) {
  if (e.getAttribute("aria-hidden") === "true") return true;
  const style = window.getComputedStyle(e);
  return !!(
    e.offsetParent === null ||
    style.display === "none" ||
    style.opacity === "0" ||
    style.fontSize === "0px" ||
    style.visibility === "hidden" ||
    style.position === "absolute" ||
    style.clip === "rect(0px, 0px, 0px, 0px)" ||
    style.clipPath === "inset(50%)" ||
    parseInt(style.width, 10) === 0 ||
    parseInt(style.height, 10) === 0
  );
}

function getTextFromElement(e) {
  // รองรับกรณี Facebook ซ่อนคำไว้ใน SVG <use xlink:href="#...">
  if (e.tagName.toLowerCase() === "use") {
    const href = e.getAttribute("xlink:href") || e.getAttribute("href");
    if (href) {
      const target = document.querySelector(href);
      if (target) return target.textContent || "";
    }
  }
  return (e.innerText === "" ? e.dataset.content : e.innerText) || "";
}

function getTextFromContainerElement(e) {
  return (
    e.dataset.content ||
    Array.prototype.filter
      .call(e.childNodes, (element) => element.nodeType === Node.TEXT_NODE)
      .map((element) => element.textContent)
      .join("")
  );
}

function getVisibleText(e) {
  if (isHidden(e)) {
    return "";
  }
  const children = e.querySelectorAll(":scope > *");
  if (children.length !== 0) {
    const elementComputedStyle = window.getComputedStyle(e);
    if (elementComputedStyle.display === "flex") {
      return (
        getTextFromContainerElement(e) +
        Array.prototype.slice
          .call(children)
          .filter((el) => {
            const style = window.getComputedStyle(el);
            return style.order !== "";
          })
          .map((el) => [parseInt(el.style.order, 10), getVisibleText(el)])
          .sort((a, b) => a[0] - b[0])
          .map((el) => el[1])
          .flat()
          .join("")
      );
    }
    return (
      getTextFromContainerElement(e) +
      Array.prototype.slice.call(children).map(getVisibleText).flat().join("")
    );
  }
  return getTextFromElement(e);
}

function hideIfSponsored(possibleSponsoredTextQueries, e) {
  if (!e || e.nodeType !== Node.ELEMENT_NODE || e.dataset.blocked) {
    return false;
  }

  if (
    allowedList.some((query) => {
      if (e.querySelector(query) !== null) {
        e.dataset.blocked = "allowedList";
        return true;
      }
      return false;
    })
  ) {
    return false;
  }

  if (
    blockedList.some((query) => {
      if (e.querySelector(query) !== null) {
        e.style.display = "none";
        e.dataset.blocked = "blockedList";
        console.info("ABfF:", `AD Blocked (${query})`, [e]);
        return true;
      }
      return false;
    })
  ) {
    return true;
  }

  return possibleSponsoredTextQueries.some((query) => {
    const result = e.querySelectorAll(query);
    const shouldUseTextFromParent = query.indexOf("order") > -1;
    return [...result].some((t) => {
      const item = shouldUseTextFromParent ? t.parentElement : t;
      const visibleText = getVisibleText(item).trim();
      if (
        sponsoredTexts.some(
          (sponsoredText) => visibleText.indexOf(sponsoredText) !== -1
        )
      ) {
        e.style.display = "none";
        e.dataset.blocked = "sponsored";
        console.info(
          "ABfF:",
          `Blocked (query='${query}', visibleText='${visibleText}')`,
          [e]
        );
        return true;
      }
      return false;
    });
  });
}

export default hideIfSponsored;
