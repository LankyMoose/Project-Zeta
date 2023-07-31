import * as Cinnabun from "cinnabun"
import { setPath } from "cinnabun/router"
import { pathStore } from "../../state/global"
import "./UserListCard.css"
import { User } from "../../db/schema"

export const UserListCard = ({ user }: { user: User }) => {
  return (
    <div className="card user-card" key={user.id}>
      <div className="card-title flex justify-content-between">
        <div className="flex gap align-items-center">
          <div className="avatar-wrapper">
            <img src={user.avatarUrl} alt={user.name} className="avatar" width="48" height="48" />
          </div>
          <h2 className="m-0">
            <a
              href={`/users/${user.id}`}
              onclick={(e: Event) => {
                e.preventDefault()
                // selectedCommunity.value = {
                //   id: community.id,
                //   title: community.title,
                //   url_title: community.url_title!,
                //   description: community.description,
                //   private: !!community.private,
                //   disabled: !!community.disabled,
                // }
                setPath(pathStore, `/users/${user.id}`)
              }}
            >
              {user.name}
            </a>
          </h2>
        </div>
      </div>
    </div>
  )
}
