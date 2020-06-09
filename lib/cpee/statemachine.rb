module CPEE

  class StateMachine
    def initialize(file,readonly,&state)
      @states = XML::Smart.open_unprotected(file)
      @state = state
      @readonly = readonly
    end

    def setable?(id,r)
      cval = @state.call(id)
      nval = r[:p].first.value
      @states.find("/states/setable/#{cval}[text()=\"#{nval}\"]").length > 0
    end

    def readonly?(id)
      @readonly.include? @state.call(id)
    end
  end

end
