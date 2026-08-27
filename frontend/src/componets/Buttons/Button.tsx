

function Button({title,type,isLoading}:{title:string,type:"submit"|"reset"|"button",isLoading:boolean}) {
  return (
    <button
            type={type}
            disabled={isLoading}
            className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800"
          >
            {!isLoading?title:"Please wait.."}
    </button>
  )
}

export default Button