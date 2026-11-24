; Дополнения к установщику Liser (подключается electron-builder автоматически).
; Если Liser уже установлен, вместо обычного мастера показывается экран обновления
; с кнопкой «Обновить»: программа ставится в ту же папку, заметки не трогаются.

!ifndef BUILD_UNINSTALLER
  !include "nsDialogs.nsh"
  !include "WordFunc.nsh"

  Var liserOld       ; установленная версия; пусто — первая установка
  Var liserCmp       ; 0 — та же версия, 1 — установлена более новая, 2 — обновление
  Var liserFinTitle
  Var liserFinText

  !define MUI_FINISHPAGE_TITLE "$liserFinTitle"
  !define MUI_FINISHPAGE_TEXT "$liserFinText"
!endif

!macro customHeader
  !ifndef BUILD_UNINSTALLER
    LangString liserWelcomeTitle ${LANG_RUSSIAN} "Установка Liser ${VERSION}"
    LangString liserWelcomeTitle ${LANG_ENGLISH} "Install Liser ${VERSION}"
    LangString liserWelcomeTitle ${LANG_HEBREW} "התקנת Liser ${VERSION}"

    LangString liserWelcomeText ${LANG_RUSSIAN} "Liser — офлайн-заметки: блоки, задачи, напоминания, рисование и связи между страницами.$\r$\n$\r$\nВсе заметки хранятся только на этом компьютере.$\r$\n$\r$\nНажмите «Далее», чтобы продолжить."
    LangString liserWelcomeText ${LANG_ENGLISH} "Liser is an offline notes app: blocks, to-dos, reminders, drawing and links between pages.$\r$\n$\r$\nYour notes stay on this computer only.$\r$\n$\r$\nClick Next to continue."
    LangString liserWelcomeText ${LANG_HEBREW} "Liser הוא אפליקציית פתקים ללא אינטרנט: בלוקים, משימות, תזכורות, ציור וקישורים בין דפים.$\r$\n$\r$\nהפתקים נשמרים רק במחשב הזה.$\r$\n$\r$\nלחצו על ‚הבא' כדי להמשיך."

    LangString liserUpdHead ${LANG_RUSSIAN} "Liser уже установлен"
    LangString liserUpdHead ${LANG_ENGLISH} "Liser is already installed"
    LangString liserUpdHead ${LANG_HEBREW} "Liser כבר מותקן"
    LangString liserUpdSub ${LANG_RUSSIAN} "На этом компьютере стоит версия $liserOld"
    LangString liserUpdSub ${LANG_ENGLISH} "Version $liserOld is installed on this computer"
    LangString liserUpdSub ${LANG_HEBREW} "במחשב הזה מותקנת גרסה $liserOld"

    LangString liserArrow ${LANG_RUSSIAN} "→"
    LangString liserArrow ${LANG_ENGLISH} "→"
    LangString liserArrow ${LANG_HEBREW} "←"

    LangString liserNewTitle ${LANG_RUSSIAN} "Доступно обновление"
    LangString liserNewTitle ${LANG_ENGLISH} "An update is available"
    LangString liserNewTitle ${LANG_HEBREW} "יש עדכון זמין"
    LangString liserNewText ${LANG_RUSSIAN} "Liser будет обновлён до версии ${VERSION} в той же папке. Заметки, настройки и резервные копии останутся на месте.$\r$\n$\r$\nЕсли Liser открыт, установщик предложит его закрыть."
    LangString liserNewText ${LANG_ENGLISH} "Liser will be updated to version ${VERSION} in the same folder. Your notes, settings and backups stay where they are.$\r$\n$\r$\nIf Liser is open, the installer will ask to close it."
    LangString liserNewText ${LANG_HEBREW} "Liser יעודכן לגרסה ${VERSION} באותה תיקייה. הפתקים, ההגדרות והגיבויים יישארו במקומם.$\r$\n$\r$\nאם Liser פתוח, אשף ההתקנה יבקש לסגור אותו."

    LangString liserSameTitle ${LANG_RUSSIAN} "Эта версия уже установлена"
    LangString liserSameTitle ${LANG_ENGLISH} "This version is already installed"
    LangString liserSameTitle ${LANG_HEBREW} "הגרסה הזו כבר מותקנת"
    LangString liserSameText ${LANG_RUSSIAN} "Переустановка восстановит файлы программы. Заметки и настройки не изменятся."
    LangString liserSameText ${LANG_ENGLISH} "Reinstalling restores the program files. Your notes and settings won't change."
    LangString liserSameText ${LANG_HEBREW} "התקנה מחדש תשחזר את קבצי התוכנה. הפתקים וההגדרות לא ישתנו."

    LangString liserOldTitle ${LANG_RUSSIAN} "Установлена более новая версия"
    LangString liserOldTitle ${LANG_ENGLISH} "A newer version is installed"
    LangString liserOldTitle ${LANG_HEBREW} "מותקנת גרסה חדשה יותר"
    LangString liserOldText ${LANG_RUSSIAN} "Этот установщик содержит более старую версию ${VERSION}. Если продолжить, Liser $liserOld будет заменён ею. Заметки сохранятся, но новые функции пропадут."
    LangString liserOldText ${LANG_ENGLISH} "This installer contains an older version, ${VERSION}. If you continue, it will replace Liser $liserOld. Your notes are kept, but newer features will be gone."
    LangString liserOldText ${LANG_HEBREW} "אשף ההתקנה הזה מכיל גרסה ישנה יותר, ${VERSION}. אם תמשיכו, היא תחליף את Liser $liserOld. הפתקים יישמרו, אבל תכונות חדשות ייעלמו."

    LangString liserFolder ${LANG_RUSSIAN} "Папка: $INSTDIR"
    LangString liserFolder ${LANG_ENGLISH} "Folder: $INSTDIR"
    LangString liserFolder ${LANG_HEBREW} "תיקייה: $INSTDIR"

    LangString liserBtnUpdate ${LANG_RUSSIAN} "Обновить"
    LangString liserBtnUpdate ${LANG_ENGLISH} "Update"
    LangString liserBtnUpdate ${LANG_HEBREW} "עדכון"
    LangString liserBtnReinstall ${LANG_RUSSIAN} "Переустановить"
    LangString liserBtnReinstall ${LANG_ENGLISH} "Reinstall"
    LangString liserBtnReinstall ${LANG_HEBREW} "התקנה מחדש"
    LangString liserBtnInstall ${LANG_RUSSIAN} "Установить"
    LangString liserBtnInstall ${LANG_ENGLISH} "Install"
    LangString liserBtnInstall ${LANG_HEBREW} "התקנה"

    LangString liserFinInstalled ${LANG_RUSSIAN} "Liser установлен"
    LangString liserFinInstalled ${LANG_ENGLISH} "Liser is installed"
    LangString liserFinInstalled ${LANG_HEBREW} "Liser הותקן"
    LangString liserFinInstalledText ${LANG_RUSSIAN} "Ярлыки появились на рабочем столе и в меню «Пуск».$\r$\n$\r$\nНажмите «Готово», чтобы закрыть мастер."
    LangString liserFinInstalledText ${LANG_ENGLISH} "Shortcuts were added to the desktop and the Start menu.$\r$\n$\r$\nClick Finish to close the wizard."
    LangString liserFinInstalledText ${LANG_HEBREW} "קיצורי דרך נוספו לשולחן העבודה ולתפריט ‚התחל'.$\r$\n$\r$\nלחצו על ‚סיום' כדי לסגור את האשף."
    LangString liserFinUpdated ${LANG_RUSSIAN} "Liser обновлён"
    LangString liserFinUpdated ${LANG_ENGLISH} "Liser has been updated"
    LangString liserFinUpdated ${LANG_HEBREW} "Liser עודכן"
    LangString liserFinUpdatedText ${LANG_RUSSIAN} "Установлена версия ${VERSION}. Все заметки на месте.$\r$\n$\r$\nНажмите «Готово», чтобы закрыть мастер."
    LangString liserFinUpdatedText ${LANG_ENGLISH} "Version ${VERSION} is now installed. All your notes are in place.$\r$\n$\r$\nClick Finish to close the wizard."
    LangString liserFinUpdatedText ${LANG_HEBREW} "גרסה ${VERSION} מותקנת עכשיו. כל הפתקים במקומם.$\r$\n$\r$\nלחצו על ‚סיום' כדי לסגור את האשף."
  !endif
!macroend

; Определяем, установлен ли Liser: версия из реестра и сам exe в папке установки
!macro customInit
  StrCpy $liserOld ""
  StrCpy $liserCmp "2"
  ReadRegStr $0 SHELL_CONTEXT "${UNINSTALL_REGISTRY_KEY}" DisplayVersion
  ${if} $0 == ""
    ReadRegStr $0 HKCU "${UNINSTALL_REGISTRY_KEY}" DisplayVersion
  ${endif}
  ${if} $0 != ""
  ${andIf} ${FileExists} "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
    StrCpy $liserOld $0
    ${VersionCompare} "$liserOld" "${VERSION}" $liserCmp
  ${endif}
  ${if} $liserOld == ""
    StrCpy $liserFinTitle "$(liserFinInstalled)"
    StrCpy $liserFinText "$(liserFinInstalledText)"
  ${else}
    StrCpy $liserFinTitle "$(liserFinUpdated)"
    StrCpy $liserFinText "$(liserFinUpdatedText)"
  ${endif}
!macroend

; Первая страница: обычное приветствие при новой установке или экран обновления
!macro customWelcomePage
  !define MUI_PAGE_CUSTOMFUNCTION_PRE liserWelcomePre
  !define MUI_WELCOMEPAGE_TITLE "$(liserWelcomeTitle)"
  !define MUI_WELCOMEPAGE_TEXT "$(liserWelcomeText)"
  !insertmacro MUI_PAGE_WELCOME
  Page custom liserUpdateShow liserUpdateLeave

  Function liserWelcomePre
    ${if} $liserOld != ""
      Abort
    ${endif}
  FunctionEnd

  Function liserUpdateShow
    ${if} $liserOld == ""
      Abort
    ${endif}
    !insertmacro MUI_HEADER_TEXT "$(liserUpdHead)" "$(liserUpdSub)"

    ${if} $liserCmp == 2
      StrCpy $R1 "$(liserNewTitle)"
      StrCpy $R2 "$(liserNewText)"
      StrCpy $R3 "$(liserBtnUpdate)"
    ${elseif} $liserCmp == 0
      StrCpy $R1 "$(liserSameTitle)"
      StrCpy $R2 "$(liserSameText)"
      StrCpy $R3 "$(liserBtnReinstall)"
    ${else}
      StrCpy $R1 "$(liserOldTitle)"
      StrCpy $R2 "$(liserOldText)"
      StrCpy $R3 "$(liserBtnInstall)"
    ${endif}

    nsDialogs::Create 1018
    Pop $0

    ${NSD_CreateLabel} 0 0 100% 14u "$R1"
    Pop $1
    CreateFont $2 "$(^Font)" 12 700
    SendMessage $1 ${WM_SETFONT} $2 1

    ${NSD_CreateLabel} 0 18u 100% 16u "$liserOld   $(liserArrow)   ${VERSION}"
    Pop $1
    CreateFont $2 "$(^Font)" 14 400
    SendMessage $1 ${WM_SETFONT} $2 1
    SetCtlColors $1 0x2383E2 transparent

    ${NSD_CreateLabel} 0 42u 100% 56u "$R2"
    Pop $1

    ${NSD_CreateLabel} 0 104u 100% 24u "$(liserFolder)"
    Pop $1
    SetCtlColors $1 0x7A7A7A transparent

    ; Кнопка «Далее» превращается в «Обновить», «Назад» не нужна
    GetDlgItem $1 $HWNDPARENT 1
    SendMessage $1 ${WM_SETTEXT} 0 "STR:$R3"
    GetDlgItem $1 $HWNDPARENT 3
    ShowWindow $1 ${SW_HIDE}

    nsDialogs::Show
  FunctionEnd

  ; Сразу к установке: лицензия, выбор режима и папки уже были приняты при первой установке
  Function liserUpdateLeave
    SendMessage $HWNDPARENT 0x408 4 ""
    Abort
  FunctionEnd
!macroend
