# ☀️ Météo Positive

Une application météo mobile qui met de l'avant vos **chances de soleil**
plutôt que vos risques de pluie. Une prévision d'« 20 % de chance de pluie »
devient « 80 % de chance de soleil » : les données restent celles
d'Environnement Canada, seul le cadrage change.

Les alertes météo officielles (veilles/avertissements) restent, elles,
affichées sans aucune reformulation — la sécurité prime toujours sur le
cadrage positif.

## Fonctionnement

- **Source de données** : le flux public [Citypage Weather d'Environnement
  et Changement climatique Canada](https://dd.weather.gc.ca/citypage_weather/)
  (Datamart, XML, mis à jour environ chaque heure, sans clé d'API).
- Une route serveur Next.js (`/api/weather`) récupère et transforme ce XML en
  JSON, car le flux d'Environnement Canada ne fournit pas d'en-têtes CORS
  utilisables directement depuis le navigateur.
- Pour chaque prévision, la « chance de soleil » = `100 % − probabilité de
  précipitation officielle`. C'est le seul endroit où l'appli reformule les
  chiffres d'Environnement Canada ; le reste (température, vent, alertes…)
  est affiché tel quel.
- La recherche de ville (`/api/sites`) et la géolocalisation utilisent la
  liste officielle des stations (`siteList.xml`), avec calcul de la station
  la plus proche par distance à vol d'oiseau (haversine).

## Démarrer en local

```bash
npm install
npm run dev
```

Puis ouvrir [http://localhost:3000](http://localhost:3000). Aucune clé d'API
n'est nécessaire.

> Remarque : les serveurs d'Environnement Canada (`dd.weather.gc.ca`)
> doivent être joignables depuis l'environnement qui exécute l'application.
> Certains bacs à sable/CI avec un accès réseau restreint peuvent bloquer ce
> domaine — ce n'est pas un problème de l'application elle-même.

## Tests

Un test de non-régression vérifie le parseur XML d'Environnement Canada à
partir d'un exemple représentatif du format documenté (utile puisqu'on ne
peut pas toujours dépendre d'un appel réseau réel en CI) :

```bash
npm test
```

## Structure du projet

```
src/
  app/
    page.tsx              # Écran principal (recherche, météo actuelle, prévisions)
    api/sites/route.ts     # Recherche de villes + station la plus proche
    api/weather/route.ts   # Météo pour une station donnée
  components/               # Composants d'UI (carte météo, prévisions, alertes…)
  lib/
    positivity.ts           # Coeur du concept : pop -> % chance de soleil
    ec/                      # Client, parseur et types Environnement Canada
tests/
  ec-parse.test.ts          # Test du parseur XML avec une fixture locale
```

## Déploiement

Application Next.js standard (App Router) : déployable sur
[Vercel](https://vercel.com/new) ou tout hébergeur Node.js
(`npm run build && npm run start`).
