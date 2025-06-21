; Script NSIS para versão PORTABLE
; Configuração específica para executável portable

!macro customInstall
  ; Versão portable - não instala no sistema
  ; Apenas cria pasta de downloads relativa ao executável
  
  ; Detectar pasta do executável
  StrCpy $0 "$EXEDIR\Downloads"
  CreateDirectory "$0"
  
  ; Usar pasta relativa para downloads (não registro)
  ; A aplicação deve detectar que é portable e usar pasta local
!macroend

!macro customUnInstall
  ; Versão portable - não precisa limpar registro
  ; Apenas remove arquivos temporários se existirem
!macroend
