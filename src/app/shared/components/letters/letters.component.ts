import { Component } from '@angular/core';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-letters',
  imports: [RouterLink],
  templateUrl: './letters.component.html',
  styleUrl: './letters.component.css',
})
export class LettersComponent {

  letters: { asci: string; bg: string; hover: string }[] = [];

  constructor() {
    const colors = [
      { bg: "bg-amber-400", hover: "hover:bg-amber-600" },   // A
      { bg: "bg-red-400", hover: "hover:bg-red-600" },       // B
      { bg: "bg-green-400", hover: "hover:bg-green-600" },   // C
      { bg: "bg-blue-400", hover: "hover:bg-blue-600" },     // D
      { bg: "bg-pink-400", hover: "hover:bg-pink-600" },     // E
      { bg: "bg-purple-400", hover: "hover:bg-purple-600" }, // F
      { bg: "bg-indigo-400", hover: "hover:bg-indigo-600" }, // G
      { bg: "bg-gray-400", hover: "hover:bg-gray-600" },     // H
      { bg: "bg-amber-500", hover: "hover:bg-amber-700" },   // I
      { bg: "bg-red-500", hover: "hover:bg-red-700" },       // J
      { bg: "bg-green-500", hover: "hover:bg-green-700" },   // K
      { bg: "bg-blue-500", hover: "hover:bg-blue-700" },     // L
      { bg: "bg-pink-500", hover: "hover:bg-pink-700" },     // M
      { bg: "bg-purple-500", hover: "hover:bg-purple-700" }, // N
      { bg: "bg-indigo-500", hover: "hover:bg-indigo-700" }, // O
      { bg: "bg-gray-500", hover: "hover:bg-gray-700" },     // P
      { bg: "bg-amber-600", hover: "hover:bg-amber-800" },   // Q
      { bg: "bg-red-600", hover: "hover:bg-red-800" },       // R
      { bg: "bg-green-600", hover: "hover:bg-green-800" },   // S
      { bg: "bg-blue-600", hover: "hover:bg-blue-800" },     // T
      { bg: "bg-pink-600", hover: "hover:bg-pink-800" },     // U
      { bg: "bg-purple-600", hover: "hover:bg-purple-800" }, // V
      { bg: "bg-indigo-600", hover: "hover:bg-indigo-800" }, // W
      { bg: "bg-gray-600", hover: "hover:bg-gray-800" },     // X
      { bg: "bg-amber-700", hover: "hover:bg-amber-900" },   // Y
      { bg: "bg-red-700", hover: "hover:bg-red-900" }        // Z
    ];

    for (let i = 0; i < 26; i++) {
      const asci = String.fromCharCode(65 + i);
      const { bg, hover } = colors[i]; // ? destructuring => باخد البروبرتي اللي بالاسم دا من الاوبجيكت احطها في متغير بنفس الاسم
      this.letters.push({ asci, bg, hover });
    }
  }


}