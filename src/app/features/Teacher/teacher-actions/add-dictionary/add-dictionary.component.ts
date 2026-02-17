import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TeacherServiceService } from '../../services/teacher-service.service';
import { forkJoin } from 'rxjs'; // Import for parallel requests
import { IAddToDictionaryResponse } from '../../interfaces/IAddToDictionaryResponse';


@Component({
  selector: 'app-add-dictionary',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './add-dictionary.component.html',
  styleUrl: './add-dictionary.component.css',
})
export class AddDictionaryComponent implements OnInit {

  private readonly teacherS = inject(TeacherServiceService);
  private readonly fb = inject(FormBuilder);

  dictionaryForm!: FormGroup;
  isLoading = false;

  // Store image previews for each row
  previews: (string | null)[] = [null];

  ngOnInit(): void {
    // Initialize with 1 empty row
    this.dictionaryForm = this.fb.group({
      words: this.fb.array([this.createWordGroup()])
    });
  }

  get wordsArray(): FormArray {
    return this.dictionaryForm.get('words') as FormArray;
  }

  // Create a Row
  createWordGroup(): FormGroup {
    return this.fb.group({
      word: ['', [Validators.required]],
      fileSource: [null, [Validators.required]],
      fileName: ['']
    });
  }

  // --- ACTIONS ---

  addWordRow(): void {
    this.wordsArray.push(this.createWordGroup());
    this.previews.push(null); // Add placeholder for new image
  }

  removeWordRow(index: number): void {
    if (this.wordsArray.length > 1) {
      this.wordsArray.removeAt(index);
      this.previews.splice(index, 1); // Remove preview
    }
  }

  onFileSelect(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];


      const currentRow = this.wordsArray.at(index);
      currentRow.patchValue({
        fileSource: file,
        fileName: file.name
      });

      //  Generate Preview
      const reader = new FileReader();
      reader.onload = () => {
        this.previews[index] = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  // --- SUBMIT ---
  onSubmit(): void {
    if (this.dictionaryForm.invalid) {
      this.dictionaryForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const requests = this.wordsArray.controls.map(control => {
      const word = control.get('word')?.value;
      const file = control.get('fileSource')?.value;

      return this.teacherS.addDictionary(word, file);
    });

    // Send all at once
    // * forkJoin will wait for all requests to complete and give us an array of responses 
    // * => from RxJS, used for handling multiple Observables in parallel
    this.isLoading = true;
    const controls = this.wordsArray.controls;

    // CASE 1: Single Item (Direct Request)
    if (controls.length === 1) {
      console.log('Sending single item...');
      const word = controls[0].get('word')?.value;
      const file = controls[0].get('fileSource')?.value;

      this.teacherS.addDictionary(word, file).subscribe({
        next: (response: IAddToDictionaryResponse) => (
          console.log('Success:', response),
          this.isLoading = false,
          this.dictionaryForm.reset(),
          this.previews = [null] // Reset preview for single item
        ),
        error: (err) => {
          console.error('Error:', err);
          this.isLoading = false;
        }
      });
    }

    // CASE 2: Multiple Items (ForkJoin)
    else {
      console.log(`Sending ${controls.length} items in parallel...`);
      const requests = controls.map(control => {
        const word = control.get('word')?.value;
        const file = control.get('fileSource')?.value;
        return this.teacherS.addDictionary(word, file);
      });

      forkJoin(requests).subscribe({
        next: (response: IAddToDictionaryResponse[]) => (
          console.log('All Success:', response),
          this.isLoading = false,
          this.dictionaryForm.reset(),
          this.previews = [null] // Reset previews after batch submission
        ),
        error: (err) => {
          console.error('Error in batch:', err);
          this.isLoading = false;
        }

      });
    }
  }
}