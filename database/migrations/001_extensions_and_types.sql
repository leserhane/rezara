-- Optimum Optic ERP — Extensions & Enum Types
-- Run in order against a fresh Supabase/Postgres database.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm; -- fuzzy/global search

create type user_role_key as enum ('admin', 'opticien');

create type gender_type as enum ('homme', 'femme', 'autre');

create type product_type as enum ('monture', 'verre', 'lentille', 'accessoire');

create type product_category_group as enum (
  'optique_homme', 'optique_femme', 'optique_enfant',
  'solaire_homme', 'solaire_femme', 'solaire_enfant',
  'sport', 'premium', 'autres'
);

create type stock_movement_type as enum (
  'entree', 'sortie', 'transfert', 'ajustement',
  'retour_fournisseur', 'retour_client', 'vente', 'inventaire'
);

create type document_status as enum (
  'brouillon', 'envoye', 'accepte', 'refuse', 'expire', 'transforme'
);

create type sale_status as enum (
  'non_paye', 'acompte', 'partiellement_paye', 'paye', 'credit', 'annule'
);

create type payment_type as enum (
  'acompte', 'solde', 'paiement_total', 'echeance_credit', 'remboursement'
);

create type payment_method_code as enum (
  'especes', 'carte', 'virement', 'cheque', 'mobile', 'autre'
);

create type cash_movement_type as enum (
  'vente', 'acompte', 'solde', 'remboursement', 'depense', 'entree', 'sortie', 'fond_ouverture'
);

create type cash_register_status as enum ('ouverte', 'cloturee');

create type order_status as enum (
  'creee', 'verres_commandes', 'en_attente', 'recue', 'montage',
  'controle', 'prete', 'client_informe', 'livree', 'annulee'
);

create type delivery_status as enum ('en_preparation', 'prete', 'livree');

create type credit_status as enum ('actif', 'solde', 'en_retard');

create type appointment_status as enum ('planifie', 'confirme', 'realise', 'annule', 'absent');

create type notification_type as enum (
  'stock_faible', 'commande_prete', 'commande_en_retard', 'credit_echeance',
  'paiement_en_retard', 'inventaire', 'nouvelle_vente', 'remise_validation', 'autre'
);
