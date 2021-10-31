import { Component, Optional } from '@angular/core';
import { HotToastService } from '@ngneat/hot-toast';
import { IData, IOhMyContext, IState, ohMyPresetId } from '@shared/type';
import { MigrationsService } from 'src/app/services/migrations.service';
import { MatDialogRef } from '@angular/material/dialog';
import compareVersions from 'compare-versions';
import { FormControl } from '@angular/forms';
import { AppStateService } from 'src/app/services/app-state.service';
import { StoreUtils } from '@shared/utils/store';

@Component({
  selector: 'oh-my-json-import',
  templateUrl: './json-import.component.html',
  styleUrls: ['./json-import.component.scss']
})
export class JsonImportComponent {

  // @Dispatch() upsertData =
  //   (data: IData, domain: string) => new UpsertData(data, this.context);
  // @Dispatch() upsertScenarios =
  //   (scenarios: Record<ohMyPresetId, string>, domain: string) => new UpsertScenarios(scenarios, { domain })

  isUploading = false;
  ctrl = new FormControl(true);
  context: IOhMyContext;

  constructor(
    @Optional() public dialogRef: MatDialogRef<JsonImportComponent>,
    private appState: AppStateService,
    private mirgationService: MigrationsService, private toast: HotToastService) { }

  onUploadFile(fileList: FileList): void {
    Array.from(fileList).forEach(file => {
      const fileReader = new FileReader();
      fileReader.onload = (fileLoadedEvent) => {

        this.isUploading = true;

        setTimeout(async () => {
          try {
            const { domain, version, data, presets } = JSON.parse(fileLoadedEvent.target.result as string) as IState & { version: string };
            const migratedState = this.mirgationService.update(await StoreUtils.init());

            if (compareVersions(version, migratedState.version) === 1) {
              this.toast.error(`Import failed, your version of OhMyMock is too old`)
            } else {
              if (migratedState.domains[domain]?.data?.length !== data.length) {
                return this.toast.warning(`Nothing imported, version of the data is too old!`);
              } else if (migratedState.version !== version) {
                this.toast.warning(`Data was migrated from version ${version} to ${migratedState.version} before import!`);
              }
              // Success
              // this.upsertScenarios(migratedState.domains[domain].scenarios, this.ctrl.value ? null : domain);
              // TODO
              // migratedState.domains[domain]?.data.forEach(d => {
              //   this.upsertData({ ...d, id: uniqueId() }, this.ctrl.value ? null : domain);
              // });

              this.toast.success(`Imported ${migratedState.domains[domain]?.data?.length || 0} mocks from ${file.name} into ${this.ctrl.value ? this.appState.domain : domain}`);
            }
          } catch {
            this.toast.error(`File ${file} does not contain (valid) JSON`);
          } finally {
            this.isUploading = false;
          }

          this.dialogRef?.close();
        }, 500);

      };

      fileReader.readAsText(file, "UTF-8");
    });
  }
}
