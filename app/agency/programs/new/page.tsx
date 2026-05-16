import { permanentRedirect } from 'next/navigation'

// L'ancien formulaire de création de programme a été remplacé par le flow
// de brief guidé en 4 étapes — toute requête vers /agency/programs/new
// est redirigée définitivement (308) vers /agency/briefs/nouveau.
export default function NewProgramRedirect() {
  permanentRedirect('/agency/briefs/nouveau')
}
