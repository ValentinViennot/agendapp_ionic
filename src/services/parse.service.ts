
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
export class ParseService {

    public parse(value:string):any {
        return JSON.parse(window.localStorage.getItem(value),this.dateParser);
    }

    private dateParser (key, value) {
        var reISO:RegExp = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;
        var reMsAjax:RegExp = /^\/Date\((d|-|.*)\)[\/|\\]$/;
        if (typeof value === 'string') {
            var a = reISO.exec(value);
            if (a) {
                return new Date(value);
            }
            a = reMsAjax.exec(value);
            if (a) {
                var b = a[1].split(/[-+,.]/);
                return new Date(b[0] ? +b[0] : 0 - +b[1]);

            }
        }
        return value;
    };
}