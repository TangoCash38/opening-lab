import { useLayoutEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { PRICE_LESSON_SCOTCH } from "@/data/pricing";
import {
  SCOTCH_LESSON_RETURN,
  SCOTCH_LESSON_SLUG,
  scotchLessonById,
  scotchLessonProductName,
  scotchLessons,
} from "@/data/lessons/scotch-course";
import { useLessonCheckout } from "@/hooks/use-lesson-checkout";
import { I18nProvider, useT } from "@/lib/i18n";
import { initBoardTheme } from "@/lib/board-theme";
import { initColorScheme } from "@/lib/color-scheme";
import { LESSON_SCOTCH_PRODUCT_ID } from "@/lib/lesson-products";
import { isLessonUnlocked, lessonScreen } from "@/lib/lesson-sync";
import { isPlayApp } from "@/lib/play-app";
import { LessonPlayer } from "./lesson-player";

export function LessonsFrame({ children }: { children: ReactNode }) {
  const [web, setWeb] = useState(true);
  useLayoutEffect(() => {
    const stopBoard = initBoardTheme();
    const stopColor = initColorScheme();
    if (isPlayApp()) {
      setWeb(false);
      window.location.replace("/");
    }
    return () => {
      stopBoard();
      stopColor();
    };
  }, []);
  if (!web) return null;
  return (
    <I18nProvider>
      <LessonsChrome>{children}</LessonsChrome>
    </I18nProvider>
  );
}

function LessonsChrome({ children }: { children: ReactNode }) {
  const t = useT();
  return (
    <div className="lessons-shell" data-surface="website" data-lessons>
      <header className="lessons-bar">
        <Link to="/" className="lessons-home" data-lessons-home>
          {t("Home")}
        </Link>
        <span className="lessons-wordmark">Opening Lab</span>
      </header>
      <main className="lessons-main">{children}</main>
    </div>
  );
}

export function LessonsCatalogue() {
  const t = useT();
  const freeCount = scotchLessons.filter((lesson) => lesson.free).length;
  return (
    <section className="lessons-catalogue" data-lessons-catalogue aria-labelledby="lessons-title">
      <h1 id="lessons-title" className="lessons-title">
        {t("Chess opening lessons")}
      </h1>
      <Link
        to="/lessons/$courseId"
        params={{ courseId: SCOTCH_LESSON_SLUG }}
        className="landing-pack-card lessons-course-card"
        data-lesson-course={SCOTCH_LESSON_SLUG}
        data-lesson-product={LESSON_SCOTCH_PRODUCT_ID}
      >
        <span className="landing-pack-name">{t(scotchLessonProductName)}</span>
        <span className="landing-pack-price" data-lesson-price>
          {t("{n} free · {price}", { n: freeCount, price: PRICE_LESSON_SCOTCH })}
        </span>
        <span className="lessons-count" data-lesson-count>
          {t("{n} lessons", { n: scotchLessons.length })}
        </span>
      </Link>
    </section>
  );
}

export function LessonCourse({ courseId }: { courseId: string }) {
  const t = useT();
  const checkout = useLessonCheckout(SCOTCH_LESSON_RETURN);
  if (courseId !== SCOTCH_LESSON_SLUG) {
    return <MissingLesson />;
  }
  const freeCount = scotchLessons.filter((lesson) => lesson.free).length;
  return (
    <section
      data-lesson-course-page={SCOTCH_LESSON_SLUG}
      data-lesson-product={LESSON_SCOTCH_PRODUCT_ID}
    >
      <Link to="/lessons" className="lessons-back" data-lessons-back>
        {t("Back")}
      </Link>
      <h1 className="lessons-title">{t(scotchLessonProductName)}</h1>
      <p className="lessons-price" data-lesson-price>
        {t("{n} free · {price}", { n: freeCount, price: PRICE_LESSON_SCOTCH })}
      </p>
      <p className="lessons-count" data-lesson-count>
        {t("{n} lessons", { n: scotchLessons.length })}
      </p>
      {checkout.owned ? (
        <p className="lessons-owned" data-lesson-owned>
          {t("Unlocked")}
        </p>
      ) : (
        <button
          type="button"
          className="lessons-unlock"
          data-lesson-unlock
          disabled={checkout.busy}
          onClick={() => {
            void checkout.pay();
          }}
        >
          {t("Unlock {packName}", { packName: scotchLessonProductName })} · {PRICE_LESSON_SCOTCH}
        </button>
      )}
      {checkout.error ? (
        <p className="lessons-error" role="alert">
          {checkout.error}
        </p>
      ) : null}
      <ul className="lessons-list" data-lesson-list>
        {scotchLessons.map((lesson) => {
          const unlocked = isLessonUnlocked(lesson, checkout.packs, LESSON_SCOTCH_PRODUCT_ID);
          const screen = lessonScreen(lesson.id, unlocked);
          const access = screen === "player" ? "free" : screen === "stub" ? "open" : "locked";
          return (
            <li key={lesson.id}>
              <Link
                to="/lessons/$courseId/$lessonId"
                params={{ courseId: SCOTCH_LESSON_SLUG, lessonId: lesson.id }}
                className="lesson-row"
                data-lesson-id={lesson.id}
                data-lesson-access={access}
              >
                <span className="lesson-row-title">{t(lesson.title)}</span>
                <span className="lesson-row-blurb">{t(lesson.blurb)}</span>
                <span className="lesson-row-state">
                  {access === "free"
                    ? t("Free")
                    : access === "locked"
                      ? `${t("Locked")} · ${PRICE_LESSON_SCOTCH}`
                      : t("Unlocked")}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function LessonGate({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const t = useT();
  const checkout = useLessonCheckout(SCOTCH_LESSON_RETURN);
  const lesson = courseId === SCOTCH_LESSON_SLUG ? scotchLessonById(lessonId) : null;
  if (!lesson) return <MissingLesson />;
  const unlocked = isLessonUnlocked(lesson, checkout.packs, LESSON_SCOTCH_PRODUCT_ID);
  const screen = lessonScreen(lesson.id, unlocked);
  if (screen === "player") {
    return <LessonPlayer title={lesson.title} />;
  }
  return (
    <article className="lesson-stub" data-lesson-stub={lesson.id} data-lesson-access={screen}>
      <Link
        to="/lessons/$courseId"
        params={{ courseId: SCOTCH_LESSON_SLUG }}
        className="lessons-back"
        data-lessons-back
      >
        {t("Back")}
      </Link>
      <h1 className="lessons-title">{t(lesson.title)}</h1>
      <p>{t(lesson.blurb)}</p>
      {screen === "locked" ? (
        <button
          type="button"
          className="lessons-unlock"
          data-lesson-unlock
          disabled={checkout.busy}
          onClick={() => {
            void checkout.pay();
          }}
        >
          {t("Unlock {packName}", { packName: scotchLessonProductName })} · {PRICE_LESSON_SCOTCH}
        </button>
      ) : (
        <p data-lesson-soon>{t("Coming soon")}</p>
      )}
      {checkout.error ? (
        <p className="lessons-error" role="alert">
          {checkout.error}
        </p>
      ) : null}
    </article>
  );
}

function MissingLesson() {
  const t = useT();
  return (
    <div>
      <p>{t("Coming soon")}</p>
      <Link to="/lessons" className="lessons-back" data-lessons-back>
        {t("Back")}
      </Link>
    </div>
  );
}
