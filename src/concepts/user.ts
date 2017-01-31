
/*
 "l'Agenda Collaboratif"
 Copyright (C)  2016  Valentin VIENNOT
 Contact : vviennot@orange.fr

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 You have to put a copy of this program's license into your project.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 FULL LICENSE FILE : https://github.com/misterw97/agendacollaboratif/edit/master/LICENSE
 */
import {Groupe} from "./groupe";
/**
 * Created by Valentin on 14/07/2016.
 */

export class User {
    // Identification unique dans la base de données
    id: number;
    // Infos générales
    prenom: string;
    nom: string;
    // NOTIFICATIONS
    // Mail de contact
    email: string;
    // Horaire du rappel pour les devoirs non faits
    notifs:number;
    // Notification des rappels
    rappels:boolean;
    // Recevoir les notifications par email
    mail: boolean;
    // TODO Notifications navigateur et facebook
    // AUTORISATION DE MODIFICATION IDENTITE
    // Permettre aux détenteurs de sous domaines sécurisés d'autoriser ou non les modifications concernant le nom/prénom
    // TODO Ajouter en BDD un boolean associé à chaque autorisation
    // TODO Penser à effectuer le contrôle au niveau de l'API
    // TODO Préparer un guide pour les acquéreurs de sous domaines
    fake_identity:boolean;
    courses:Groupe[];
    root:number;
}