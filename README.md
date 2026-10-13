My Life · Field Journal — V0.2
Free offline-first PWA prototype for water logging, editable reminders, habits, Rove weekly targets, project stages and weekly reflection. Data is stored locally in the browser. Use Week → Export data backup to save a JSON copy.
Install
Host this folder on an HTTPS site or localhost, open it in Android Chrome, then use the browser menu → Install app / Add to Home screen. Opening index.html directly from a ZIP is not enough for full PWA installation.
Important notification limitation
This prototype tracks reminders but does not yet deliver dependable background alarms. Android may suspend a PWA when the browser is closed or battery-optimized. Do not rely on this as the sole medication alarm; a native Android local-notification layer and real-device testing are needed for that.
