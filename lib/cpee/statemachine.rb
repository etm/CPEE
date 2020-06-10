module CPEE

  class StateMachine
    def initialize(file,readonly,&state)
      @states = XML::Smart.open_unprotected(file)
      @state = state
      @readonly = readonly
    end

    def setable?(id,nval)
      cval = @state.call(id)
      @states.find("/states/setable/#{cval}[#{nval}]").length > 0
    end

    def readonly?(id)
      @readonly.include? @state.call(id)
    end
  end

end
