import { doc, getDoc, setDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"

const REQUIRED_OTHERS_FIELDS = {
  brands: [],
  category: [],
  images: [],
  homepageSlider: [],
}

export async function ensureFirebaseStructure() {
  const othersRef = doc(db, "rajaoil", "others")
  const othersSnap = await getDoc(othersRef)

  if (!othersSnap.exists()) {
    await setDoc(othersRef, REQUIRED_OTHERS_FIELDS)
    return
  }

  const data = othersSnap.data()
  const missingFields = Object.entries(REQUIRED_OTHERS_FIELDS).reduce<
    Partial<typeof REQUIRED_OTHERS_FIELDS>
  >((fields, [key, value]) => {
    if (!(key in data)) {
      return { ...fields, [key]: value }
    }

    return fields
  }, {})

  if (Object.keys(missingFields).length > 0) {
    await setDoc(othersRef, missingFields, { merge: true })
  }
}
