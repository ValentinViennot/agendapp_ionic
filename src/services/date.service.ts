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
/**
 * Created by Valentin on 16/07/2016.
 */
import {Injectable} from "@angular/core";


@Injectable()
export class DateService {
    today: Date;

    constructor() {
        this.today = new Date();
        this.today.setHours(20);
    }

    public getDay(date:Date):string {
        let day:string = "ERREUR";
        switch (date.getDay()) {
            case 0:
                day="Dimanche";
                break;
            case 1:
                day="Lundi";
                break;
            case 2:
                day="Mardi";
                break;
            case 3:
                day="Mercredi";
                break;
            case 4:
                day="Jeudi";
                break;
            case 5:
                day="Vendredi";
                break;
            case 6:
                day="Samedi";
                break;
        }
        return day;
    }

    public getDayTiny(date:Date):string {
        return `${this.getDay(date).substr(0, 3)}.`;
    }

    public recentDateTime(date:Date):string {
        //if (date.toDateString()==this.today.toDateString()) {
        if (date.toLocaleDateString()==this.today.toLocaleDateString()) {
            return date.toLocaleTimeString().substr(0,5);
        } else {
            return date.toLocaleDateString();
        }
    }

    public jjmm(date:Date):string {
        return date.toLocaleDateString().substr(0,5);
    }

    public getMonth(date:Date):string {
        switch (date.getMonth()) {
            case 0:
                return "Janvier";
            case 1:
                return "Février";
            case 2:
                return "Mars";
            case 3:
                return "Avril";
            case 4:
                return "Mai";
            case 5:
                return "Juin";
            case 6:
                return "Juillet";
            case 7:
                return "Août";
            case 8:
                return "Septembre";
            case 9:
                return "Octobre";
            case 10:
                return "Novembre";
            case 11:
                return "Décembre";
        }
    }

}
