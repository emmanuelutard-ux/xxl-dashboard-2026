# Spécifications Fonctionnelles - XXL Dashboard

Ce document centralise les règles de gestion et le cadre fonctionnel pour l'évolution du projet "XXL Dashboard".

## 1. Objectif
Le projet doit devenir une **plateforme de gestion marketing** dédiée aux **promoteurs immobiliers**.
Il sert de point de pilotage central pour les performances des campagnes et la gestion des programmes.

## 2. Architecture Métier

### 2.1 Entité Principale : Programmes
*   L'entité pivot de l'application est le "Programme Immobilier" (ex: *Résidence du Lac*, *Les Jardins de la Gare*).
*   Toutes les données (KPIs, médias, budgets) sont rattachées soit à la vue globale (Portefeuille), soit à un Programme spécifique.

### 2.2 Gestion Multi-Rôles
L'application dessert 3 types d'utilisateurs avec des besoins distincts :
1.  **Client (Promoteur) :**
    *   Vision simplifiée et macro-économique.
    *   Focus sur le **CPL** (Coût Par Lead) et les volumes globaux.
    *   Accès à des graphiques consolidés pour la prise de décision rapide.
2.  **Agency (Agence Média) :**
    *   Gestion opérationnelle des campagnes.
    *   Accès à la **Media Room** pour l'upload et la validation des créatifs (fichiers images/vidéos).
3.  **Expert (Responsable Acquisition) :**
    *   Pilotage fin et granulaire.
    *   Suivi du **pacing budgétaire** (consommation journalière vs budget prévu).
    *   Capacité à changer les sources de données et analyser les écarts.

## 3. Règles Data Critiques

### 3.1 Sources de Conversion
Les leads (conversions) remontent de deux types de sources :
*   **Régies Publicitaires :** Google Ads, Meta Ads (Facebook/Instagram), etc.
*   **Analytics :** Google Analytics 4 (GA4).

### 3.2 Configuration par Programme
*   Chaque Programme Immobilier dispose d'un paramètre de configuration : `conversion_source`.
*   Valeurs possibles :
    *   `'platform'` : Les KPIs de conversion affichés proviennent des régies (données natives Google/Meta).
    *   `'ga4'` : Les KPIs de conversion affichés proviennent de GA4 (vision "sitecentric").

### 3.3 Conséquence sur le Dashboard
*   Le calcul des KPIs (CPA, Taux de conv., Volume Leads) **DOIT** être dynamique et respecter le choix `conversion_source` du programme consulté.
*   L'utilisateur "Expert" peut avoir la liberté de switcher temporairement cette vue pour analyse, mais le paramètre par défaut est strict.
