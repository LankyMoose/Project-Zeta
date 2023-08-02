import * as Cinnabun from "cinnabun"
import { createSignal } from "cinnabun"
import { Modal, ModalBody, ModalHeader } from "../modal/Modal"
import { communityNsfwAgreementModalOpen, selectedCommunityUrlTitle } from "../../state/community"
import { Button } from "../Button"
import { agreeToCommunityNsfw } from "../../../client/actions/communities"
import { EllipsisLoader } from "../loaders/Ellipsis"

export const CommunityNsfwAgreementModal = () => {
  const loading = createSignal(false)

  const handleAgree = async () => {
    if (loading.value) return
    loading.value = true
    if (!selectedCommunityUrlTitle.value) return console.error("No selected community")
    const res = await agreeToCommunityNsfw(selectedCommunityUrlTitle.value)
    loading.value = false
    if (!res) return
    communityNsfwAgreementModalOpen.value = false
    window.location.reload()
  }

  return (
    <Modal
      visible={communityNsfwAgreementModalOpen}
      toggle={() => (communityNsfwAgreementModalOpen.value = false)}
    >
      <ModalHeader>
        <h2>NSFW Agreement</h2>
      </ModalHeader>
      <ModalBody>
        <p className="mb-3">
          This community contains NSFW content. By clicking "I agree" below, you agree that you are
          18 years of age or older and that you are not offended by NSFW content.
        </p>
        <div className="flex justify-content-end">
          <Button
            type="button"
            className="btn btn-primary hover-animate btn-lg"
            watch={loading}
            bind:disabled={() => loading.value}
            onclick={handleAgree}
          >
            I agree
            <EllipsisLoader watch={loading} bind:visible={() => loading.value} />
          </Button>
        </div>
      </ModalBody>
    </Modal>
  )
}
