"use client";

import { useEffect } from "react";

export default function WpChrome({
  headerHtml,
  footerHtml,
  children,
}: {
  headerHtml: string;
  footerHtml: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const opens = [...document.querySelectorAll(".wp-block-navigation__responsive-container-open")];
    const closes = [...document.querySelectorAll(".wp-block-navigation__responsive-container-close")];
    const containers = [...document.querySelectorAll(".wp-block-navigation__responsive-container")];

    const openMenu = (e: Event) => {
      e.preventDefault();
      containers.forEach((c) => c.classList.add("is-menu-open", "has-modal-open"));
      document.documentElement.classList.add("has-modal-open");
    };
    const closeMenu = (e: Event) => {
      e.preventDefault();
      containers.forEach((c) => c.classList.remove("is-menu-open", "has-modal-open"));
      document.documentElement.classList.remove("has-modal-open");
    };

    opens.forEach((el) => el.addEventListener("click", openMenu));
    closes.forEach((el) => el.addEventListener("click", closeMenu));

    const forms = [...document.querySelectorAll("form.kb-advanced-form, form.wpcf7-form, form.uagb-forms-main-form")];
    const onSubmit = async (e: Event) => {
      e.preventDefault();
      const form = e.currentTarget as HTMLFormElement;
      const data = Object.fromEntries(new FormData(form).entries());
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      alert(res.ok ? "The form has been submitted successfully!" : "There has been some error while submitting the form.");
      if (res.ok) form.reset();
    };
    forms.forEach((form) => form.addEventListener("submit", onSubmit));

    return () => {
      opens.forEach((el) => el.removeEventListener("click", openMenu));
      closes.forEach((el) => el.removeEventListener("click", closeMenu));
      forms.forEach((form) => form.removeEventListener("submit", onSubmit));
    };
  }, []);

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: headerHtml }} />
      {children}
      <div dangerouslySetInnerHTML={{ __html: footerHtml }} />
    </>
  );
}
