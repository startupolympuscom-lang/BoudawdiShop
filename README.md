# Boudawdi Shop — Gestion de caisse & stock

Application web de démonstration pour gérer une supérette : stock, caisse, ventes et fournisseurs.
Interface disponible en **français** et en **arabe** (RTL).

## Fonctionnalités

- **Tableau de bord** : chiffre d'affaires du jour, nombre de ventes, panier moyen, marge, graphique 7/30 jours, meilleures ventes, alertes de stock bas.
- **Caisse (POS)** : scan du code-barres (douchette USB ou caméra), recherche, filtres par catégorie, ticket, paiement espèces/carte avec calcul de la monnaie, ticket imprimable.
- **Produits** : nom, catégorie, code-barres (scan, saisie ou génération), prix de vente/achat, quantité, seuil d'alerte, fournisseur. Ajustement rapide du stock.
- **Catégories** : création des familles de produits (laitiers, entretien, épicerie…) avec couleur, nombre de produits et valeur du stock.
- **Fournisseurs & commandes** : fiches fournisseurs, bons de commande (avec ajout automatique des produits en stock bas), réception qui met à jour le stock et le prix d'achat.
- **Ventes** : journal jour par jour, détail des tickets, annulation (remise en stock), rapport Z de clôture.
- **Paramètres** : nom du magasin, devise, langue, données de démo, export/import JSON, réinitialisation.

## Mode démo

Pas d'authentification ni de serveur : toutes les données sont enregistrées dans le navigateur (`localStorage`).
Le scan par caméra nécessite `localhost` ou HTTPS.

## Lancer le projet

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # version statique dans dist/
```

Stack : React 19, TypeScript, Vite, Tailwind CSS 4, Zustand, ZXing (lecture des codes-barres).
