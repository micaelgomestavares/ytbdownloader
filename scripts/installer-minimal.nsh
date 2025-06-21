; Script NSIS minimalista para evitar dupla instalação
; Apenas salva uma configuração padrão no registro

; Definir ícone do instalador
!define MUI_ICON "${BUILD_RESOURCES_DIR}\favicon.ico"
!define MUI_UNICON "${BUILD_RESOURCES_DIR}\favicon.ico"

!macro customInstall
  ; Criar pasta padrão de downloads se não existir
  CreateDirectory "$DOCUMENTS\YouTube MP3 Downloads"
  
  ; Salvar configuração padrão no registro
  WriteRegStr HKCU "Software\YouTube MP3 Converter" "DownloadFolder" "$DOCUMENTS\YouTube MP3 Downloads"
  WriteRegStr HKCU "Software\YouTube MP3 Converter" "FirstRun" "true"
!macroend

!macro customUnInstall
  ; Limpar registro
  DeleteRegKey HKCU "Software\YouTube MP3 Converter"
!macroend
